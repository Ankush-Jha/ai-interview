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
  "strengths": string[] (what the student got right),
  "gaps": string[] (what was missed or incorrect),
  "followUpQuestion": string | null (a probing question to deepen understanding, or null)
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
