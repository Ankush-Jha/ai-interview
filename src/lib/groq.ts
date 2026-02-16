import type { DocumentAnalysis, Topic, BloomLevel } from '@/types/document'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

function getApiKey(): string {
    const key = import.meta.env.VITE_GROQ_API_KEY
    if (!key) {
        throw new Error(
            'Groq API key not configured. Add VITE_GROQ_API_KEY to your .env.local file.'
        )
    }
    return key
}

/** Truncate text to ~6000 words to stay within model context limits */
function truncateText(text: string, maxWords = 6000): string {
    const words = text.split(/\s+/)
    if (words.length <= maxWords) return text
    return words.slice(0, maxWords).join(' ') + '\n\n[Text truncated...]'
}

const SYSTEM_PROMPT = `You are an educational content analyzer. Given lecture material or study notes, analyze the content and return a JSON object with exactly this structure:

{
  "title": "A concise title for the material",
  "summary": "A 2-3 sentence summary of the key content",
  "topics": [
    {
      "name": "Topic name",
      "description": "Brief description of this topic in context",
      "bloomLevel": "remember|understand|apply|analyze|evaluate|create"
    }
  ],
  "keyTerms": ["term1", "term2", "term3"],
  "estimatedDifficulty": "introductory|intermediate|advanced"
}

Rules:
- Extract 3-8 meaningful topics from the material
- Assign Bloom's taxonomy levels based on the cognitive depth required
- Extract 5-15 key terms that are central to the content
- Estimate difficulty based on the complexity of concepts
- Return ONLY valid JSON, no markdown or explanation`

interface GroqResponse {
    choices: Array<{
        message: {
            content: string
        }
    }>
}

/**
 * Analyze document content using Groq API.
 * Extracts topics, key terms, difficulty, and summary.
 */
export async function analyzeContent(
    text: string,
    title: string,
    totalPages: number
): Promise<DocumentAnalysis> {
    const apiKey = getApiKey()
    const truncated = truncateText(text)

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: `Analyze this study material (title: "${title}"):\n\n${truncated}`,
                },
            ],
            temperature: 0.3,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
        }),
    })

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        if (response.status === 401) {
            throw new Error('Invalid Groq API key. Check VITE_GROQ_API_KEY in .env.local.')
        }
        if (response.status === 429) {
            throw new Error('Groq rate limit reached. Please wait a moment and try again.')
        }
        throw new Error(`Groq API error (${response.status}): ${errorText}`)
    }

    const data: GroqResponse = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
        throw new Error('Empty response from Groq API')
    }

    const parsed = JSON.parse(content)

    // Validate and normalize
    const validBloomLevels: BloomLevel[] = [
        'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create',
    ]

    const topics: Topic[] = (parsed.topics || []).map((t: Record<string, unknown>) => ({
        name: String(t.name || 'Unnamed'),
        description: String(t.description || ''),
        bloomLevel: validBloomLevels.includes(t.bloomLevel as BloomLevel)
            ? (t.bloomLevel as BloomLevel)
            : 'understand',
    }))

    return {
        title: String(parsed.title || title),
        summary: String(parsed.summary || ''),
        topics,
        keyTerms: Array.isArray(parsed.keyTerms)
            ? parsed.keyTerms.map(String)
            : [],
        estimatedDifficulty:
            ['introductory', 'intermediate', 'advanced'].includes(parsed.estimatedDifficulty)
                ? parsed.estimatedDifficulty
                : 'intermediate',
        totalPages,
        rawText: text,
    }
}
