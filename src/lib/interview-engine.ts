import type { StoredDocument } from '@/types/document'
import type {
    InterviewConfig,
    Question,
    Evaluation,
    QuestionType,
    Difficulty,
} from '@/types/interview'

// ── Config ─────────────────────────────────────────────────────────
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

function getApiKey(): string {
    const key = import.meta.env.VITE_GROQ_API_KEY
    if (!key) throw new Error('VITE_GROQ_API_KEY is not set in .env.local')
    return key
}

function truncateText(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text
    return text.slice(0, maxChars) + '\n\n[content truncated]'
}

// ── Bloom's level targeting by difficulty ──────────────────────────
const BLOOM_TARGETS: Record<Difficulty, string> = {
    introductory: 'remember and understand',
    intermediate: 'apply and analyze',
    advanced: 'evaluate and create',
}

// ── Persona voice descriptions ────────────────────────────────────
const PERSONA_VOICE: Record<string, string> = {
    socratic: 'You guide through questioning. Ask "why?" and "how?" to lead the student to discover answers themselves. Be warm but intellectually rigorous.',
    friendly: 'You are encouraging, warm, and supportive. Use casual language, celebrate small wins, and gently correct mistakes. Make the student feel comfortable.',
    challenging: 'You are direct and push for precision. Challenge vague answers, ask for specifics, and hold a high standard. Be respectful but demanding.',
}

// ── Generate Greeting ──────────────────────────────────────────────
export async function generateGreeting(
    doc: StoredDocument,
    config: InterviewConfig
): Promise<string> {
    const apiKey = getApiKey()
    const topicNames = doc.topics.map((t) => t.name).join(', ')

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: `You are an AI interview coach. ${PERSONA_VOICE[config.persona] || PERSONA_VOICE.socratic}

Generate a SHORT, warm greeting (2-3 sentences max) to start an interview session. Mention:
- You've reviewed their material on the document title
- The topics you'll cover (pick 2-3 key ones)
- The difficulty level in a natural way
- End with something like "Ready to begin?" or "Let's get started!"

Keep it concise and natural. No bullet points, no formatting. Just a conversational greeting.`,
                },
                {
                    role: 'user',
                    content: `Document: "${doc.title}"\nTopics: ${topicNames}\nDifficulty: ${config.difficulty}\nNumber of questions: ${config.questionCount}`,
                },
            ],
            temperature: 0.8,
            max_tokens: 200,
        }),
    })

    if (!response.ok) {
        // Fallback greeting if API fails
        return `Hey! I've reviewed your material on "${doc.title}". We'll cover ${config.questionCount} questions at the ${config.difficulty} level, focusing on topics like ${topicNames}. Ready to begin?`
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    return content?.trim() || `Hey! I've reviewed your material on "${doc.title}". We'll cover ${config.questionCount} questions at the ${config.difficulty} level. Let's get started!`
}

// ── Generate Transition ────────────────────────────────────────────
export async function generateTransition(
    prevEvaluation: Evaluation,
    nextQuestion: Question,
    config: InterviewConfig
): Promise<string> {
    const apiKey = getApiKey()

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: `You are an AI interview coach. ${PERSONA_VOICE[config.persona] || PERSONA_VOICE.socratic}

Generate a VERY SHORT transition (1 sentence max) between interview questions. Based on the previous answer's score, provide a brief bridge to the next topic.

Rules:
- If score was high (70+): brief acknowledgment + move forward
- If score was low (<50): gentle encouragement + move on
- Reference the next topic naturally
- Keep under 20 words. Be conversational.
- No formatting, no bullets. Just one natural sentence.`,
                },
                {
                    role: 'user',
                    content: `Previous score: ${prevEvaluation.score}/100\nPrevious topic: ${prevEvaluation.questionId}\nNext question type: ${nextQuestion.type}\nNext topic: ${nextQuestion.topicName}`,
                },
            ],
            temperature: 0.8,
            max_tokens: 80,
        }),
    })

    if (!response.ok) {
        // Fallback transitions
        if (prevEvaluation.score >= 70) return "Nice work! Let's keep going."
        return "Let's move on to the next topic."
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    return content?.trim() || "Let's move on to the next one."
}

// ── Generate Questions ─────────────────────────────────────────────
export async function generateQuestions(
    doc: StoredDocument,
    config: InterviewConfig
): Promise<Question[]> {
    const apiKey = getApiKey()
    const context = truncateText(doc.rawText, 4000)
    const topicList = doc.topics.map((t) => `- ${t.name}: ${t.description}`).join('\n')

    const systemPrompt = `You are a ${config.persona} Socratic interviewer. Generate exactly ${config.questionCount} interview questions based on the study material provided.

Target Bloom's taxonomy levels: ${BLOOM_TARGETS[config.difficulty]}.
Question types to include: ${config.questionTypes.join(', ')}.

Topics in this material:
${topicList}

Rules:
- Questions must be directly answerable from the material
- Mix question types as specified
- Graduate difficulty within the set
- Each question should test a specific topic
- For "conceptual": test understanding of concepts and definitions
- For "applied": test ability to use knowledge in scenarios
- For "analytical": test ability to break down, compare, or evaluate

Respond with a JSON object: { "questions": [...] }
Each question: { "text": string, "type": "conceptual"|"applied"|"analytical", "topicName": string, "bloomLevel": string, "difficulty": "${config.difficulty}" }`

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `Study material title: "${doc.title}"\n\nSummary: ${doc.summary}\n\nContent:\n${context}`,
                },
            ],
            temperature: 0.7,
            max_tokens: 3000,
            response_format: { type: 'json_object' },
        }),
    })

    if (!response.ok) {
        const body = await response.text()
        if (response.status === 429) throw new Error('Rate limited — please wait a moment and retry')
        throw new Error(`Groq API error (${response.status}): ${body.slice(0, 200)}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty response from Groq API')

    const parsed = JSON.parse(content)
    const raw = Array.isArray(parsed.questions) ? parsed.questions : []

    return raw.map((q: Record<string, unknown>, i: number) => ({
        id: `q-${i}`,
        text: String(q.text || ''),
        type: (['conceptual', 'applied', 'analytical'].includes(q.type as string)
            ? q.type
            : 'conceptual') as QuestionType,
        topicName: String(q.topicName || ''),
        bloomLevel: String(q.bloomLevel || 'understand'),
        difficulty: config.difficulty,
    }))
}

// ── Evaluate Answer ────────────────────────────────────────────────
export async function evaluateAnswer(
    question: Question,
    answer: string,
    documentContext: string
): Promise<Evaluation> {
    const apiKey = getApiKey()
    const context = truncateText(documentContext, 2000)

    const systemPrompt = `You are a Socratic tutor evaluating a student's answer. Be encouraging but honest.

Scoring guide:
- 90-100: Comprehensive, demonstrates deep understanding
- 70-89: Good understanding with minor gaps
- 50-69: Partial understanding, significant gaps
- 30-49: Minimal understanding
- 0-29: Off-topic or incorrect

Respond with a JSON object:
{
  "score": number (0-100),
  "feedback": string (2-3 sentences, constructive),
  "conversationalFeedback": string (1 SHORT sentence, warm and natural — like "Great answer! You nailed the key concept." or "Not quite — the key idea is about X rather than Y."),
  "strengths": string[] (what the student got right, 1-3 items),
  "gaps": string[] (what was missed or incorrect, 0-3 items),
  "followUpQuestion": string | null (a probing question to deepen understanding if score < 80, or null if they nailed it)
}`

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `Question: ${question.text}\n\nStudent's answer: ${answer}\n\nReference material:\n${context}`,
                },
            ],
            temperature: 0.3,
            max_tokens: 1000,
            response_format: { type: 'json_object' },
        }),
    })

    if (!response.ok) {
        const body = await response.text()
        if (response.status === 429) throw new Error('Rate limited — please wait a moment and retry')
        throw new Error(`Groq API error (${response.status}): ${body.slice(0, 200)}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty response from Groq API')

    const parsed = JSON.parse(content)

    return {
        questionId: question.id,
        score: typeof parsed.score === 'number' ? Math.min(100, Math.max(0, parsed.score)) : 50,
        feedback: String(parsed.feedback || 'No feedback available.'),
        conversationalFeedback: String(parsed.conversationalFeedback || parsed.feedback || 'Let me review that.'),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
        followUpQuestion: parsed.followUpQuestion ? String(parsed.followUpQuestion) : undefined,
    }
}

// ── Adaptive Difficulty ────────────────────────────────────────────
const DIFFICULTY_LADDER: Difficulty[] = ['introductory', 'intermediate', 'advanced']

export function adjustDifficulty(
    evaluations: Evaluation[],
    currentDifficulty: Difficulty
): Difficulty {
    if (evaluations.length < 2) return currentDifficulty

    const last2 = evaluations.slice(-2)
    const a = last2[0]!
    const b = last2[1]!
    const avgScore = (a.score + b.score) / 2
    const idx = DIFFICULTY_LADDER.indexOf(currentDifficulty)

    if (avgScore > 80 && idx < DIFFICULTY_LADDER.length - 1) {
        return DIFFICULTY_LADDER[idx + 1]!
    }
    if (avgScore < 40 && idx > 0) {
        return DIFFICULTY_LADDER[idx - 1]!
    }
    return currentDifficulty
}
