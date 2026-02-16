import { useState, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getDocument } from '@/lib/documents'
import { saveSession } from '@/lib/sessions'
import {
    generateQuestions,
    generateGreeting,
    generateTransition,
    evaluateAnswer,
    adjustDifficulty,
} from '@/lib/interview-engine'
import type { StoredDocument } from '@/types/document'
import type {
    InterviewConfig,
    InterviewSession,
    Question,
    Answer,
    Evaluation,
    Difficulty,
    TranscriptEntry,
    InterviewPhase,
} from '@/types/interview'

let transcriptCounter = 0
function makeTranscriptId(): string {
    return `t-${Date.now()}-${++transcriptCounter}`
}

export function useInterview(documentId: string, config: InterviewConfig) {
    const { user } = useAuth()
    const [session, setSession] = useState<InterviewSession | null>(null)
    const [phase, setPhase] = useState<InterviewPhase>('loading')
    const [error, setError] = useState<string | null>(null)
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
    const [greetingText, setGreetingText] = useState('')
    const docRef = useRef<StoredDocument | null>(null)
    const currentDifficultyRef = useRef<Difficulty>(config.difficulty)
    const initRef = useRef(false)

    // ── Add entry to transcript ────────────────────────────────────
    const addTranscript = useCallback((entry: Omit<TranscriptEntry, 'id' | 'timestamp'>) => {
        setTranscript((prev) => [
            ...prev,
            {
                ...entry,
                id: makeTranscriptId(),
                timestamp: new Date().toISOString(),
            },
        ])
    }, [])

    // ── Initialize ─────────────────────────────────────────────────
    const initialize = useCallback(async () => {
        if (!user || initRef.current) return
        initRef.current = true

        try {
            setPhase('loading')
            setError(null)
            setTranscript([])

            // Load document
            const doc = await getDocument(user.uid, documentId)
            if (!doc) throw new Error('Document not found')
            docRef.current = doc

            // Generate questions
            const questions = await generateQuestions(doc, config)
            if (questions.length === 0) throw new Error('No questions generated')

            // Generate greeting
            let greeting: string
            try {
                greeting = await generateGreeting(doc, config)
            } catch {
                greeting = `Hi! I've reviewed your material on "${doc.title}". Let's go through ${config.questionCount} questions together. Ready?`
            }

            setGreetingText(greeting)

            const newSession: InterviewSession = {
                id: `session-${Date.now()}`,
                documentId,
                userId: user.uid,
                documentTitle: doc.title,
                config,
                questions,
                answers: [],
                evaluations: [],
                state: 'in-progress',
                currentQuestionIndex: 0,
                followUpPending: false,
                startedAt: new Date().toISOString(),
            }

            setSession(newSession)

            // Add greeting to transcript
            addTranscript({
                role: 'ai',
                type: 'greeting',
                text: greeting,
            })

            setPhase('greeting')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start interview')
            setPhase('error')
        }
    }, [user, documentId, config, addTranscript])

    // ── Start interview (after greeting) ───────────────────────────
    const startInterview = useCallback(() => {
        if (!session) return
        const firstQ = session.questions[0]
        if (!firstQ) return

        addTranscript({
            role: 'ai',
            type: 'question',
            text: firstQ.text,
        })

        setPhase('ready')
    }, [session, addTranscript])

    // ── Submit Answer ──────────────────────────────────────────────
    const submitAnswer = useCallback(async (answerText: string) => {
        if (!session || !docRef.current) return
        const isFollowUp = session.followUpPending
        const question = session.questions[session.currentQuestionIndex]
        if (!question) return

        // Add user answer to transcript
        addTranscript({
            role: 'user',
            type: isFollowUp ? 'follow-up' : 'answer',
            text: answerText,
        })

        setPhase('evaluating')

        try {
            const answer: Answer = {
                questionId: isFollowUp ? `${question.id}-followup` : question.id,
                text: answerText,
                timestamp: new Date().toISOString(),
            }

            const evaluation = await evaluateAnswer(
                question,
                answerText,
                docRef.current.rawText
            )

            const newAnswers = [...session.answers, answer]
            const newEvaluations = [...session.evaluations, evaluation]

            // Adjust difficulty based on performance
            currentDifficultyRef.current = adjustDifficulty(
                newEvaluations,
                currentDifficultyRef.current
            )

            // Add conversational feedback to transcript
            addTranscript({
                role: 'ai',
                type: 'feedback',
                text: evaluation.conversationalFeedback || evaluation.feedback,
                evaluation,
            })

            // If there is a follow-up question and we're not already on one, queue it
            const shouldFollowUp = !isFollowUp && evaluation.followUpQuestion && evaluation.score < 80

            if (shouldFollowUp) {
                // Add follow-up question to transcript
                setTimeout(() => {
                    addTranscript({
                        role: 'ai',
                        type: 'follow-up',
                        text: evaluation.followUpQuestion!,
                    })
                }, 800)
            }

            const isLast = !shouldFollowUp && session.currentQuestionIndex >= session.questions.length - 1
            const overallScore = isLast
                ? Math.round(newEvaluations.reduce((s, e) => s + e.score, 0) / newEvaluations.length)
                : undefined

            const updatedSession: InterviewSession = {
                ...session,
                answers: newAnswers,
                evaluations: newEvaluations,
                state: isLast ? 'completed' : 'in-progress',
                completedAt: isLast ? new Date().toISOString() : undefined,
                overallScore,
                followUpPending: !!shouldFollowUp,
            }

            setSession(updatedSession)

            if (isLast) {
                // Add closing message
                setTimeout(() => {
                    addTranscript({
                        role: 'ai',
                        type: 'closing',
                        text: `Great session! You answered ${newAnswers.length} questions with an average score of ${overallScore}%. Let's review your results.`,
                    })
                }, 1000)
                setPhase('completed')

                // Save to Firestore
                if (user) {
                    saveSession(user.uid, updatedSession).catch(() => {
                        // Silent — session data is still in memory
                    })
                }
            } else if (shouldFollowUp) {
                setPhase('follow-up')
            } else {
                setPhase('showing-feedback')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to evaluate answer')
            setPhase('ready') // allow retry
        }
    }, [session, user, addTranscript])

    // ── Next Question ──────────────────────────────────────────────
    const nextQuestion = useCallback(async () => {
        if (!session) return

        const nextIdx = session.currentQuestionIndex + 1
        const nextQ = session.questions[nextIdx]
        if (!nextQ) return

        // Generate transition from previous evaluation
        const prevEval = session.evaluations[session.evaluations.length - 1]
        if (prevEval) {
            try {
                const transition = await generateTransition(prevEval, nextQ, session.config)
                addTranscript({
                    role: 'ai',
                    type: 'transition',
                    text: transition,
                })
                // Small delay before showing the question
                await new Promise((r) => setTimeout(r, 600))
            } catch {
                // Skip transition on error, just show the question
            }
        }

        // Add next question to transcript
        addTranscript({
            role: 'ai',
            type: 'question',
            text: nextQ.text,
        })

        setSession({
            ...session,
            currentQuestionIndex: nextIdx,
            followUpPending: false,
        })
        setPhase('ready')
    }, [session, addTranscript])

    // ── Advance from follow-up answer ──────────────────────────────
    const submitFollowUp = useCallback(async (answerText: string) => {
        if (!session) return
        // Treat the follow-up response as a regular submission
        // but clear the follow-up flag after
        await submitAnswer(answerText)
    }, [session, submitAnswer])

    // ── Reset Session ──────────────────────────────────────────────
    const resetSession = useCallback(() => {
        initRef.current = false
        setSession(null)
        setTranscript([])
        setPhase('loading')
        setError(null)
        setGreetingText('')
        currentDifficultyRef.current = config.difficulty
    }, [config.difficulty])

    // ── Derived state ──────────────────────────────────────────────
    const currentQuestion: Question | null =
        session?.questions[session.currentQuestionIndex] ?? null

    const latestEvaluation: Evaluation | null =
        session?.evaluations[session.evaluations.length - 1] ?? null

    const progress = session
        ? {
            current: session.answers.length,
            total: session.questions.length,
            score: session.evaluations.length > 0
                ? Math.round(
                    session.evaluations.reduce((s, e) => s + e.score, 0) /
                    session.evaluations.length
                )
                : 0,
        }
        : { current: 0, total: 0, score: 0 }

    return {
        session,
        phase,
        error,
        currentQuestion,
        latestEvaluation,
        progress,
        transcript,
        greetingText,
        currentDifficulty: currentDifficultyRef.current,
        initialize,
        startInterview,
        submitAnswer,
        submitFollowUp,
        nextQuestion,
        resetSession,
    }
}
