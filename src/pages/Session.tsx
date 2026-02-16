import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { useInterview } from '@/hooks/useInterview'
import type { InterviewConfig } from '@/types/interview'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
    Loader2,
    AlertCircle,
    Send,
    ArrowRight,
    CheckCircle2,
    Trophy,
    Home,
    Lightbulb,
    TrendingUp,
    TrendingDown,
} from 'lucide-react'

const DEFAULT_CONFIG: InterviewConfig = {
    persona: 'socratic',
    difficulty: 'intermediate',
    questionCount: 5,
    questionTypes: ['conceptual', 'applied'],
}

const bloomColors: Record<string, string> = {
    remember: 'bg-slate-100 text-slate-700 border-slate-200',
    understand: 'bg-blue-50 text-blue-700 border-blue-200',
    apply: 'bg-green-50 text-green-700 border-green-200',
    analyze: 'bg-amber-50 text-amber-700 border-amber-200',
    evaluate: 'bg-orange-50 text-orange-700 border-orange-200',
    create: 'bg-violet-50 text-violet-700 border-violet-200',
}

function ScoreRing({ score }: { score: number }) {
    const color =
        score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-500' : 'text-red-500'
    return (
        <div className={`text-3xl font-bold ${color}`}>{score}</div>
    )
}

export default function Session() {
    const { id } = useParams<{ id: string }>()
    const location = useLocation()
    const config = (location.state as { config?: InterviewConfig })?.config ?? DEFAULT_CONFIG

    const {
        session,
        phase,
        error,
        currentQuestion,
        latestEvaluation,
        showingFeedback,
        progress,
        initialize,
        submitAnswer,
        nextQuestion,
    } = useInterview(id ?? '', config)

    const [answerText, setAnswerText] = useState('')
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        initialize()
    }, [initialize])

    // Reset answer text when moving to next question
    useEffect(() => {
        if (currentQuestion && !showingFeedback) {
            setAnswerText('')
            setSubmitted(false)
        }
    }, [currentQuestion?.id, showingFeedback])

    async function handleSubmit() {
        if (!answerText.trim()) return
        setSubmitted(true)
        await submitAnswer(answerText.trim())
    }

    function handleNext() {
        nextQuestion()
    }

    // ── Loading ────────────────────────────────────────────────────────
    if (phase === 'loading') {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-7 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Card>
                    <CardContent className="flex items-center justify-center gap-3 py-12">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            Generating your interview questions…
                        </p>
                    </CardContent>
                </Card>
                <div className="space-y-2 max-w-md mx-auto">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
        )
    }

    // ── Error ──────────────────────────────────────────────────────────
    if (phase === 'error') {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Interview</h1>
                </div>
                <Card className="border-destructive/50">
                    <CardContent className="flex items-start gap-3 py-6">
                        <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-destructive">
                                Something went wrong
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{error}</p>
                            <div className="flex gap-2 mt-4">
                                <Button variant="outline" size="sm" asChild>
                                    <Link to="/">Back to Dashboard</Link>
                                </Button>
                                <Button size="sm" onClick={() => window.location.reload()}>
                                    Retry
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // ── Completed ──────────────────────────────────────────────────────
    if (phase === 'completed' && session) {
        const timeTaken = session.completedAt
            ? Math.round(
                (new Date(session.completedAt).getTime() -
                    new Date(session.startedAt).getTime()) /
                60000
            )
            : 0

        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Interview Complete
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {session.documentTitle}
                    </p>
                </div>

                {/* Overall score */}
                <Card>
                    <CardContent className="flex flex-col items-center py-10">
                        <Trophy className="h-8 w-8 text-amber-500 mb-3" />
                        <div className="text-5xl font-bold mb-1">
                            {session.overallScore ?? 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                    </CardContent>
                </Card>

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3">
                    <Card>
                        <CardContent className="py-4 text-center">
                            <p className="text-2xl font-semibold">{session.questions.length}</p>
                            <p className="text-xs text-muted-foreground">Questions</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-4 text-center">
                            <p className="text-2xl font-semibold">{progress.score}</p>
                            <p className="text-xs text-muted-foreground">Avg Score</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-4 text-center">
                            <p className="text-2xl font-semibold">{timeTaken}m</p>
                            <p className="text-xs text-muted-foreground">Duration</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Per-question breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Question Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {session.evaluations.map((ev, i) => {
                            const q = session.questions[i]
                            return (
                                <div key={ev.questionId} className="flex items-start gap-3">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{q?.text}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {ev.feedback}
                                        </p>
                                    </div>
                                    <ScoreRing score={ev.score} />
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link to="/">
                            <Home className="mr-2 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    // ── In Progress ────────────────────────────────────────────────────
    if (!session || !currentQuestion) return null

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Interview</h1>
                <p className="text-sm text-muted-foreground">
                    {session.documentTitle}
                </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                        Question {progress.current + (showingFeedback ? 0 : 1)} of {progress.total}
                    </span>
                    {progress.current > 0 && (
                        <span>Avg score: {progress.score}</span>
                    )}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full bg-foreground transition-all duration-500"
                        style={{
                            width: `${((progress.current + (showingFeedback ? 0 : 1)) / progress.total) * 100}%`,
                        }}
                    />
                </div>
            </div>

            {/* Current Question */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                            variant="outline"
                            className={`text-[10px] ${bloomColors[currentQuestion.bloomLevel] || ''}`}
                        >
                            {currentQuestion.bloomLevel}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                            {currentQuestion.type}
                        </Badge>
                        {currentQuestion.topicName && (
                            <span className="text-[11px] text-muted-foreground">
                                {currentQuestion.topicName}
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm leading-relaxed font-medium">
                        {currentQuestion.text}
                    </p>
                </CardContent>
            </Card>

            {/* Answer input — only when not showing feedback */}
            {!showingFeedback && (
                <div className="space-y-3">
                    <textarea
                        className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                        placeholder="Type your answer here…"
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        disabled={phase === 'evaluating' || submitted}
                        rows={4}
                    />
                    <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={!answerText.trim() || phase === 'evaluating' || submitted}
                    >
                        {phase === 'evaluating' ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Evaluating…
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Submit Answer
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* Feedback card */}
            {showingFeedback && latestEvaluation && (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="py-6">
                            <div className="flex items-center gap-4 mb-4">
                                <ScoreRing score={latestEvaluation.score} />
                                <div>
                                    <p className="text-sm font-medium">
                                        {latestEvaluation.score >= 80
                                            ? 'Excellent!'
                                            : latestEvaluation.score >= 50
                                                ? 'Good effort'
                                                : 'Keep practicing'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {latestEvaluation.feedback}
                                    </p>
                                </div>
                            </div>

                            <Separator className="my-4" />

                            {/* Strengths */}
                            {latestEvaluation.strengths.length > 0 && (
                                <div className="mb-3">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                                        <span className="text-xs font-medium text-green-700">
                                            Strengths
                                        </span>
                                    </div>
                                    <ul className="space-y-1">
                                        {latestEvaluation.strengths.map((s, i) => (
                                            <li key={i} className="text-xs text-foreground/70 pl-5">
                                                • {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Gaps */}
                            {latestEvaluation.gaps.length > 0 && (
                                <div className="mb-3">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
                                        <span className="text-xs font-medium text-amber-700">
                                            Areas to improve
                                        </span>
                                    </div>
                                    <ul className="space-y-1">
                                        {latestEvaluation.gaps.map((g, i) => (
                                            <li key={i} className="text-xs text-foreground/70 pl-5">
                                                • {g}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Follow-up hint */}
                            {latestEvaluation.followUpQuestion && (
                                <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                                    <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-medium">Think about this</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {latestEvaluation.followUpQuestion}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Next / Complete */}
                    {session.currentQuestionIndex < session.questions.length - 1 ? (
                        <Button className="w-full" onClick={handleNext}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Next Question
                        </Button>
                    ) : (
                        <Button
                            className="w-full"
                            onClick={() =>
                                submitAnswer('__complete__').catch(() => {
                                    // session is already completed via the hook
                                })
                            }
                            disabled
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Interview Complete
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
