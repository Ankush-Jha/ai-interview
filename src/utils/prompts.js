/**
 * Centralized prompt templates for all AI interactions.
 * Each prompt has persona modifiers and baked-in GOOD/BAD examples.
 */

// ─── Robotic phrases to strip from AI output ─────────────────────────────────
const ROBOTIC_PHRASES = [
    /^(To accomplish this( task)?,? )/i,
    /^(In order to )/i,
    /^(One (would|should|could|can) )/i,
    /^(It is (important|essential|necessary) to (note|understand) that )/i,
    /^(The (answer|solution|approach|implementation) (is|involves|requires) )/i,
    /^(This (can be|is) (achieved|accomplished|done) by )/i,
    /^(For this (purpose|task|scenario),? )/i,
    /^(As (a|an) (result|consequence),? )/i,
];

/**
 * Clean up model output to sound more natural.
 */
export function humanize(text) {
    if (!text || typeof text !== "string") return text;
    let cleaned = text;

    // Strip robotic openers
    for (const pattern of ROBOTIC_PHRASES) {
        cleaned = cleaned.replace(pattern, "");
    }

    // Capitalize first letter after stripping
    if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Replace overly formal phrases with casual ones
    const swaps = [
        [/\butilize\b/gi, "use"],
        [/\bdemonstrates?\b/gi, "shows"],
        [/\bnevertheless\b/gi, "still"],
        [/\bfurthermore\b/gi, "also"],
        [/\bhowever,?\s/gi, "but "],
        [/\btherefore,?\s/gi, "so "],
        [/\badditionally,?\s/gi, "also, "],
        [/\bconsequently,?\s/gi, "so "],
        [/\bin conclusion,?\s/gi, ""],
        [/\bthe candidate\b/gi, "you"],
        [/\bthe user\b/gi, "you"],
        [/\bthe student\b/gi, "you"],
        [/\bthe response\b/gi, "your answer"],
        [/\blacks? (clarity|precision)\b/gi, "could be clearer"],
        [/\binsufficient\b/gi, "not enough"],
        [/\bcomprehensive\b/gi, "thorough"],
        [/\bfundamental\b/gi, "basic"],
    ];

    for (const [pattern, replacement] of swaps) {
        cleaned = cleaned.replace(pattern, replacement);
    }

    return cleaned;
}

/**
 * Recursively humanize all string values in an object.
 */
export function humanizeResponse(obj) {
    if (!obj || typeof obj !== "object") return obj;

    const result = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key of Object.keys(result)) {
        if (typeof result[key] === "string") {
            result[key] = humanize(result[key]);
        } else if (Array.isArray(result[key])) {
            result[key] = result[key].map((item) =>
                typeof item === "string" ? humanize(item) : humanizeResponse(item)
            );
        } else if (typeof result[key] === "object" && result[key] !== null) {
            result[key] = humanizeResponse(result[key]);
        }
    }

    return result;
}

// ─── Persona tone modifiers ──────────────────────────────────────────────────
const PERSONA_TONES = {
    "quiz-master": "You're a sharp but fair quiz master. Keep it focused, clear, and a bit energetic.",
    academic: "You're a knowledgeable professor. Be thorough but approachable — explain like you enjoy teaching.",
    hr: "You're a friendly HR professional. Be warm, professional, and focus on real-world applicability.",
    peer: "You're a chill colleague helping a friend prep. Be super casual, supportive, and real.",
};

export function getPersonaTone(persona) {
    return PERSONA_TONES[persona] || PERSONA_TONES["quiz-master"];
}

// ─── Prompt Templates ────────────────────────────────────────────────────────

export function buildAnalyzePrompt(text) {
    return {
        system: `You are a smart content analyst. Summarize things clearly and simply — no jargon.
Respond with ONLY valid JSON, nothing else.`,
        user: `Read this document and tell me what it covers.

Return a JSON object with:
- "topics": main topics covered (array of short strings)
- "themes": big-picture themes (array)
- "difficulty": how hard is this content? ("easy" | "medium" | "hard")
- "keyTerms": important technical words (array)
- "summary": 2-3 sentence summary in plain English

Document:
"""
${text.slice(0, 8000)}
"""

ONLY return the JSON object.`,
    };
}

export function buildQuestionsPrompt(content, config) {
    const {
        difficulty = "mixed",
        count = 5,
        types = ["mcq", "open-ended"],
        persona = "quiz-master",
    } = config || {};

    const tone = getPersonaTone(persona);

    return {
        system: `${tone} Ask questions the way a real person would — simple, clear, conversational.
Never use overly academic or textbook language.
Respond with ONLY a valid JSON array.`,
        user: `Generate ${count} interview questions based on this content.

STYLE RULES:
- Write like you're asking someone face-to-face
- GOOD question: "What's a dictionary in Python and when would you use one?"
- BAD question: "Elaborate on the significance of dictionary data structures in Python programming"
- Keep each question focused on ONE concept
- Difficulty level: ${difficulty}
- Types: ${types.join(", ")}

Return a JSON array. Each item:
- "id": number (1, 2, 3...)
- "type": "mcq" | "open-ended" | "scenario"
- "question": simple, conversational question
- "options": 4 options array (MCQ only, null for others)
- "correctAnswer": the right answer
- "difficulty": "easy" | "medium" | "hard"
- "topic": related topic
- "points": 5 (easy), 10 (medium), 15 (hard)

Content:
"""
${content.slice(0, 6000)}
"""

ONLY return the JSON array.`,
    };
}

export function buildEvaluatePrompt(question, userAnswer, context) {
    return {
        system: `You're a chill, supportive interviewer giving feedback after a practice round.
Talk like a real human — warm, specific, encouraging. NOT a grading rubric.
Respond with ONLY valid JSON.`,
        user: `Question: "${question}"
Candidate said: "${userAnswer}"
${context ? `Topic context: "${context.slice(0, 2000)}"` : ""}

IMPORTANT:
- Accept correct answers from ANY source — books, experience, anything. Not just the document.
- If they got the main idea right, that's 7+. Only dock for genuinely wrong stuff.
- Be generous and encouraging.

Return JSON with these exact keys. Follow the GOOD examples, avoid the BAD ones:

"score": 0-10

"feedback": (2-3 sentences)
  GOOD: "Nice! You clearly know how dictionaries work — the key-value pair concept was spot on. Just try throwing in a quick code example next time, it really shows you can walk the talk."
  BAD: "The candidate demonstrates understanding of dictionary concepts. However, the explanation lacks clarity and precision."

"modelAnswer": (how a real person would answer — casual but correct, 2-4 sentences)
  GOOD: "I'd create a dictionary like students = {101: 'Alice', 102: 'Bob'} — roll numbers as keys, names as values. To look someone up, just do students[101] and you get 'Alice'. Dictionaries are perfect for this kind of quick lookup."
  BAD: "To accomplish this task, one would utilize a Python dictionary data structure where keys represent roll numbers and values represent student names."

"strengths": 2-3 items
  GOOD: ["Knows what dictionaries are for", "Right approach to the problem"]
  BAD: ["Demonstrates understanding of data structures", "Recognizes key-value mapping utility"]

"improvements": 2-3 items
  GOOD: ["Drop in a code snippet like students = {1: 'John'}", "Say 'key-value pair' — interviewers like hearing that"]
  BAD: ["Employ precise technical terminology", "Structure explanation with syntax examples"]

"keywordsFound": terms they mentioned
"keywordsMissed": terms they should've mentioned

ONLY return the JSON.`,
    };
}

export function buildReportPrompt(qaPairs, settings, questionCount) {
    return {
        system: `You're a supportive interview coach wrapping up a practice session.
Write like you're talking to the person — specific, encouraging, actionable. Not a corporate report.
Respond with ONLY valid JSON.`,
        user: `Here's how the interview went. Write a personal coaching report.

Session: ${settings?.difficulty || "mixed"} difficulty, ${questionCount} questions

Results:
${JSON.stringify(qaPairs, null, 2)}

Return JSON:
- "overallScore": 0-100 (be realistic — 60-75 is average, 80+ is strong)
- "grade": A+, A, B+, B, C+, C, D, or F
- "executiveSummary": 3-4 sentences like a coach wrapping up.
  GOOD: "You've got a solid handle on the basics here — especially X. The tricky part was Y, but honestly that just needs a bit more practice. Overall, you're headed in the right direction."
  BAD: "The candidate demonstrated competence in multiple areas. Performance metrics indicate satisfactory knowledge levels."
- "strengths": 3-5 specific things, natural language
  GOOD: ["Can explain core concepts clearly", "Good instinct for choosing the right data structure"]
  BAD: ["Demonstrates competency in fundamental concepts"]
- "weaknesses": 2-4 growth areas, framed kindly
  GOOD: ["Could go deeper on edge cases", "Practice explaining 'why' not just 'what'"]
  BAD: ["Insufficient understanding of advanced topics"]
- "recommendations": 3-5 concrete tips
  GOOD: ["Build a mini project using dictionaries — hands-on practice sticks way better than reading"]
  BAD: ["Study data structures more thoroughly"]
- "topicBreakdown": [{ "topic": string, "score": 0-100, "questionsCount": number }]
- "matchLevel": "Excellent Match" | "Good Match" | "Fair Match" | "Needs Improvement"


ONLY return the JSON.`,
    };
}

// ─── Coding Mode Prompts ─────────────────────────────────────────────────────

export function buildModeDetectionPrompt(text) {
    return {
        system: `You classify content for interview modes. Respond with ONLY valid JSON.`,
        user: `Scan this document. Does it have programming/coding content?

Look for: code snippets, algorithms, "implement", "function", data structures, programming concepts.

Return JSON:
- "hasCoding": true/false
- "codingTopics": array of coding topics found (e.g., ["sorting", "linked lists"])
- "languages": detected programming languages (e.g., ["Python", "JavaScript"])
- "hasVoice": true/false — has behavioral/soft-skill content good for voice?

Document:
"""
${text.slice(0, 6000)}
"""

ONLY return the JSON.`,
    };
}

export function buildCodingQuestionsPrompt(content, config) {
    const { difficulty = "mixed", count = 3 } = config || {};

    return {
        system: `You generate practical Python coding questions with test cases. Respond with ONLY a valid JSON array. No markdown, no explanation.`,
        user: `Generate ${count} coding questions based on this content. Difficulty: ${difficulty}.

Each question must have the user write a **Python function**.

RULES:
- Function names must be snake_case (e.g., "calculate_average", "find_max_value")
- Test case "input" must be a VALID Python expression that can be passed to the function as a single argument
- Test case "expected" must be a VALID Python expression (the expected return value)
- Include 3-5 test cases per question
- Problems should be solvable in 10-20 lines
- starterCode must be valid Python with def and pass

CORRECT test case examples:
  {"input": "{\"Alice\": 85, \"Bob\": 90}", "expected": "87.5", "description": "two students"}
  {"input": "[3, 1, 4, 1, 5]", "expected": "5", "description": "list of numbers"}
  {"input": "\"hello world\"", "expected": "\"dlrow olleh\"", "description": "reverse string"}
  {"input": "(5, 3)", "expected": "8", "description": "add two numbers"}

WRONG test case examples (DO NOT do this):
  {"input": "Alice: 85, Bob: 90"} ← not valid Python
  {"input": "5, 3"} ← ambiguous, use a tuple instead

Return a JSON array where each item has:
- "id": number
- "type": "coding"
- "mode": "coding"
- "question": clear problem statement mentioning the function name
- "functionName": snake_case function name
- "language": "python"
- "starterCode": "def function_name(param):\\n    # Write your solution here\\n    pass"
- "testCases": [{"input": "valid python expr", "expected": "valid python expr", "description": "what it tests"}]
- "difficulty": "easy" | "medium" | "hard"
- "topic": related topic from the content
- "points": 5 (easy) / 10 (medium) / 15 (hard)
- "hints": array of 2-3 hint strings
- "constraints": array of 1-2 constraint strings (e.g., "1 ≤ len(list) ≤ 1000")

Content:
"""
${content.slice(0, 6000)}
"""

ONLY return the JSON array, nothing else.`,
    };
}

export function buildCodeEvalPrompt(question, code, testResults, language) {
    return {
        system: `You're a supportive coding mentor. Be encouraging and specific. Talk like a real person.
Respond with ONLY valid JSON.`,
        user: `Review this code submission.

Question: "${question}"
Language: ${language}
Code:
\`\`\`
${code}
\`\`\`
Test results: ${JSON.stringify(testResults)}

Return JSON:
"score": 0-10 (mostly based on test pass rate, but consider code quality)
"feedback": 2-3 sentences, warm and specific
"strengths": 2-3 items
"improvements": 2-3 items
"modelAnswer": clean, well-commented solution code as a string
"complexity": { "time": "O(n)", "space": "O(1)" }

ONLY return the JSON.`,
    };
}

// ─── Conversational Interview Prompts ────────────────────────────────────────

export function buildConversationalEvalPrompt(question, answer, history, context) {
    const historyStr = (history || [])
        .slice(-6)
        .map(m => `${m.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${m.text}`)
        .join('\n');

    return {
        system: `You are a warm, professional interviewer having a natural conversation with a candidate. You evaluate their answers and decide what to do next.

CRITICAL RULES:
- Talk like a REAL interviewer — warm, natural, specific
- Your "response" is what you'll SAY to the candidate (spoken aloud)
- Keep responses SHORT (2-3 sentences max) — this is a conversation, not a lecture
- Be encouraging even on weak answers
- NEVER say "score" or "points" — the candidate shouldn't know they're being scored
- Handle non-answer situations NATURALLY like a real interviewer would:
  * If the candidate asks you to repeat/rephrase the question → repeat or rephrase it warmly
  * If the candidate says something unrelated or off-topic → gently redirect them back
  * If the candidate says "I don't know" → encourage them and offer a hint or move on
  * If the candidate makes small talk or asks about the process → respond briefly and redirect

Respond with ONLY valid JSON.`,
        user: `Current question: "${question}"
Candidate's answer: "${answer}"
${historyStr ? `\nConversation so far:\n${historyStr}` : ''}
${context ? `\nTopic context: "${context.slice(0, 2000)}"` : ''}

FIRST: Analyze the candidate's response. Is it:
A) An actual attempt to answer the question → evaluate normally
B) A request to repeat/rephrase the question (e.g., "can you repeat that?", "what was the question?", "say that again") → use action "repeat_question"
C) Off-topic / unrelated / random / not an answer (e.g., talking about something else, gibberish, just greeting) → use action "off_topic"
D) "I don't know" / giving up → evaluate with low score but be encouraging

Return JSON with these exact keys:
"score": 0-10 (your internal assessment, candidate won't see this. Use 0 for repeat/off-topic)
"response": Your spoken response (2-3 sentences, natural and warm)
  For normal answers:
    GOOD: "That's a solid take! You nailed the key concept there."
    BAD: "Your answer demonstrates proficiency in the subject matter."
  For repeat requests:
    GOOD: "Sure thing! Let me ask that again: [rephrase the question naturally]"
    BAD: "Repeating the question..."
  For off-topic:
    GOOD: "Ha, I appreciate the enthusiasm! But let's get back on track — [rephrase question briefly]"
    BAD: "That is not relevant to the question."
"action": one of "follow_up" | "next_question" | "wrap_up" | "repeat_question" | "off_topic"
  - "repeat_question" if they asked to repeat/rephrase the question
  - "off_topic" if their answer is unrelated, random, or not an attempt to answer
  - "follow_up" if score < 6 and they genuinely tried (you want to probe deeper)
  - "next_question" if score >= 6 (good enough, move on)
  - "wrap_up" only if this is the last question
"followUpQuestion": (only if action is "follow_up") A probing question. Be specific.
  GOOD: "Interesting — can you walk me through what would happen if the input list was empty?"
  BAD: "Can you elaborate on your answer?"
"strengths": 1-2 brief items (empty array for repeat/off-topic)
"improvements": 1-2 brief items (empty array for repeat/off-topic)
"keywordsFound": terms they mentioned
"keywordsMissed": key terms they should have mentioned

ONLY return the JSON.`,
    };
}

export function buildFollowUpPrompt(originalQuestion, userAnswer, previousFollowUps) {
    const prevStr = previousFollowUps.map((f, i) => `Follow-up ${i + 1}: ${f}`).join('\n');
    return {
        system: `You are a friendly interviewer asking a follow-up question. Be natural and conversational. Keep it SHORT.
Respond with ONLY valid JSON.`,
        user: `Original question: "${originalQuestion}"
Candidate said: "${userAnswer}"
${prevStr ? `Previous follow-ups already asked:\n${prevStr}` : ''}

Generate a NEW follow-up question that probes a DIFFERENT angle than previous follow-ups.
Make it specific and helpful — guide them toward demonstrating their knowledge.

Return JSON:
"question": the follow-up question (1-2 sentences)
"hint": a subtle nudge without giving away the answer

ONLY return the JSON.`,
    };
}

export function buildTransitionPrompt(fromPhase, toPhase, performance) {
    return {
        system: `You are a friendly interviewer transitioning between sections. Be natural and brief. One sentence.
Respond with ONLY a JSON object.`,
        user: `Transition from "${fromPhase}" questions to "${toPhase}" questions.
Candidate performance so far: ${performance || 'decent'}

Return JSON:
"transition": A natural transition sentence the interviewer would say.
  GOOD examples:
  - "Great technical answers! Now let's switch gears — I'd love to hear about your experiences."
  - "Awesome coding work! Let me ask you a few scenario-based questions next."
  - "Nice! Let's wrap up the theory and jump into some hands-on coding."

ONLY return the JSON.`,
    };
}

export function buildIntroPrompt(topics, difficulty, questionCount) {
    return {
        system: `You are a friendly AI interviewer starting a practice session. Be warm, brief, and encouraging. One short paragraph.
Respond with ONLY a JSON object.`,
        user: `Start an interview session on: ${(topics || []).slice(0, 5).join(', ') || 'general topics'}
Difficulty: ${difficulty || 'medium'}
Total questions: ${questionCount || 5}

Return JSON:
"intro": A warm, natural intro (2-3 sentences). Mention the topics briefly and set expectations.
  GOOD: "Hey! Welcome to your practice session. We'll cover some ${topics?.[0] || 'interesting'} topics today — about ${questionCount} questions, nothing too intense. Ready when you are!"
  BAD: "Welcome to this automated assessment. You will be evaluated on the following criteria..."

ONLY return the JSON.`,
    };
}

export function buildWrapUpPrompt(scores, topics) {
    const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
        : 0;
    return {
        system: `You are a friendly interviewer wrapping up a practice session. Be warm, brief, and constructive. 2-3 sentences.
Respond with ONLY a JSON object.`,
        user: `Session complete. Average score: ${avgScore}/10.
Topics covered: ${(topics || []).join(', ')}
Individual scores: ${scores.join(', ')}

Return JSON:
"wrapUp": A warm closing statement (2-3 sentences). Highlight what went well and one area to work on. Be encouraging.
  GOOD: "That was a great session! You really nailed the data structures questions. If I were you, I'd spend a bit more time on recursion concepts — but overall, solid work!"
  BAD: "The assessment has concluded. Your performance was rated at 7.2/10."

ONLY return the JSON.`,
    };
}

