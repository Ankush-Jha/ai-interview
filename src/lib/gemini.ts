import { GoogleGenAI } from "@google/genai";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnalysisResult {
    summary: string;
    topics: string[];
    themes: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
    keyTerms: string[];
}

export interface QuestionOption {
    label: string;
    text: string;
    isCorrect: boolean;
}

export interface Question {
    id: number;
    type: "mcq" | "open-ended" | "scenario";
    question: string;
    options?: QuestionOption[];
    correctAnswer: string;
    difficulty: "easy" | "medium" | "hard";
    topic: string;
    explanation: string;
}

export interface QuestionConfig {
    difficulty: "easy" | "medium" | "hard" | "mixed";
    count: number;
    types: ("mcq" | "open-ended" | "scenario")[];
    persona: "quiz-master" | "job-interviewer" | "professor";
}

export interface EvaluationResult {
    score: number;            // 0–10
    isCorrect: boolean;
    feedback: string;
    modelAnswer: string;
    strengths: string[];
    improvements: string[];
}

export interface ReportResult {
    overallScore: number;     // 0–100
    totalQuestions: number;
    correctAnswers: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    topicBreakdown: {
        topic: string;
        score: number;
        total: number;
    }[];
}

// ─── Client ───────────────────────────────────────────────────────────────────

function getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
        throw new Error(
            "GEMINI_API_KEY is not configured. Get a free key at https://aistudio.google.com/apikey"
        );
    }
    return new GoogleGenAI({ apiKey });
}

const MODEL = "gemini-2.5-flash-preview-05-20";

/**
 * Helper: call Gemini and parse JSON from the response.
 */
async function callGemini<T>(prompt: string): Promise<T> {
    const client = getClient();
    const response = await client.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        },
    });

    const text = response.text?.trim();
    if (!text) {
        throw new Error("Empty response from Gemini");
    }

    try {
        return JSON.parse(text) as T;
    } catch {
        // Sometimes the response has markdown fencing, strip it
        const cleaned = text.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "");
        return JSON.parse(cleaned) as T;
    }
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Analyze PDF content: identify topics, themes, difficulty, key terms, and summary.
 */
export async function analyzeContent(text: string): Promise<AnalysisResult> {
    const prompt = `You are an expert content analyst. Analyze the following document content and return a structured analysis.

DOCUMENT CONTENT:
"""
${text.slice(0, 30000)}
"""

Return a JSON object with EXACTLY this structure:
{
  "summary": "A clear 2-3 sentence summary of what this document covers",
  "topics": ["topic1", "topic2", ...],
  "themes": ["theme1", "theme2", ...],
  "difficulty": "beginner" | "intermediate" | "advanced",
  "keyTerms": ["term1", "term2", ...]
}

Rules:
- topics: List 3-8 main topics covered in the document
- themes: List 2-5 overarching themes
- difficulty: Assess the complexity level of the content
- keyTerms: List 5-15 important technical terms or concepts
- Return ONLY valid JSON, no other text`;

    return callGemini<AnalysisResult>(prompt);
}

/**
 * Generate interview questions based on content and configuration.
 */
export async function generateQuestions(
    content: string,
    config: QuestionConfig
): Promise<Question[]> {
    const personaInstructions = {
        "quiz-master":
            "You are an enthusiastic Quiz Master. Your questions are engaging, clear, and test understanding. Use encouraging language.",
        "job-interviewer":
            "You are a professional Job Interviewer. Your questions are practical, scenario-based, and assess real-world application of knowledge.",
        professor:
            "You are a thorough University Professor. Your questions test deep understanding, critical thinking, and ability to explain concepts.",
    };

    const typeInstructions = config.types
        .map((t) => {
            switch (t) {
                case "mcq":
                    return 'MCQ questions with 4 options (A, B, C, D). Exactly one correct answer.';
                case "open-ended":
                    return "Open-ended questions that require detailed explanations.";
                case "scenario":
                    return "Scenario-based questions that present a situation and ask how to respond.";
            }
        })
        .join("\n- ");

    const prompt = `${personaInstructions[config.persona]}

Based on the following content, generate exactly ${config.count} interview questions.

CONTENT:
"""
${content.slice(0, 30000)}
"""

REQUIREMENTS:
- Difficulty: ${config.difficulty === "mixed" ? "Mix of easy, medium, and hard" : config.difficulty}
- Question types to include:
- ${typeInstructions}
- Each question must be grounded in the provided content
- Questions should progressively test deeper understanding

Return a JSON array of question objects with EXACTLY this structure:
[
  {
    "id": 1,
    "type": "mcq" | "open-ended" | "scenario",
    "question": "The question text",
    "options": [
      {"label": "A", "text": "Option text", "isCorrect": false},
      {"label": "B", "text": "Option text", "isCorrect": true},
      {"label": "C", "text": "Option text", "isCorrect": false},
      {"label": "D", "text": "Option text", "isCorrect": false}
    ],
    "correctAnswer": "The correct answer text or letter",
    "difficulty": "easy" | "medium" | "hard",
    "topic": "The topic this question covers",
    "explanation": "Why this is the correct answer"
  }
]

Rules:
- "options" field is REQUIRED for "mcq" type, omit for other types
- For "open-ended" and "scenario", correctAnswer should be a comprehensive model answer
- IDs must be sequential starting from 1
- Return ONLY valid JSON array, no other text`;

    return callGemini<Question[]>(prompt);
}

/**
 * Evaluate a user's answer against the expected answer and source content.
 */
export async function evaluateAnswer(
    question: Question,
    userAnswer: string,
    context: string
): Promise<EvaluationResult> {
    const prompt = `You are an expert evaluator assessing a student's answer.

QUESTION:
"""
${question.question}
"""

QUESTION TYPE: ${question.type}
CORRECT/MODEL ANSWER: ${question.correctAnswer}
TOPIC: ${question.topic}

STUDENT'S ANSWER:
"""
${userAnswer}
"""

SOURCE CONTENT (for context):
"""
${context.slice(0, 10000)}
"""

Evaluate the student's answer and return a JSON object with EXACTLY this structure:
{
  "score": <number 0-10>,
  "isCorrect": <boolean>,
  "feedback": "Detailed, constructive feedback explaining the evaluation",
  "modelAnswer": "The ideal complete answer",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}

Rules:
- score: 0 = completely wrong, 5 = partially correct, 10 = perfect answer
- isCorrect: true if score >= 7
- For MCQ: strict matching — either correct or not (score 0 or 10)
- For open-ended/scenario: grade on completeness, accuracy, and depth
- feedback: Be constructive and specific, reference the content
- strengths: What the student got right (can be empty array)
- improvements: Specific areas to improve (can be empty array)
- Return ONLY valid JSON, no other text`;

    return callGemini<EvaluationResult>(prompt);
}

/**
 * Generate a comprehensive performance report from session data.
 */
export async function generateReport(sessionData: {
    questions: Question[];
    answers: string[];
    scores: number[];
    evaluations: EvaluationResult[];
}): Promise<ReportResult> {
    const questionSummary = sessionData.questions.map((q, i) => ({
        question: q.question,
        topic: q.topic,
        difficulty: q.difficulty,
        type: q.type,
        userAnswer: sessionData.answers[i] || "(no answer)",
        score: sessionData.scores[i] || 0,
        feedback: sessionData.evaluations[i]?.feedback || "",
    }));

    const prompt = `You are an expert assessment analyst. Generate a comprehensive performance report.

SESSION DATA:
"""
${JSON.stringify(questionSummary, null, 2)}
"""

Return a JSON object with EXACTLY this structure:
{
  "overallScore": <number 0-100>,
  "totalQuestions": ${sessionData.questions.length},
  "correctAnswers": <number of questions with score >= 7>,
  "summary": "A 3-4 sentence executive summary of the student's performance",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...],
  "topicBreakdown": [
    {"topic": "topic name", "score": <questions correct>, "total": <total questions>}
  ]
}

Rules:
- overallScore: Calculate as (sum of all scores / (total * 10)) * 100, rounded
- Group questions by topic for topicBreakdown
- strengths: 2-4 areas where the student performed well
- weaknesses: 2-4 areas needing improvement
- recommendations: 3-5 actionable study recommendations
- Return ONLY valid JSON, no other text`;

    return callGemini<ReportResult>(prompt);
}
