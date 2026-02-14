/**
 * Conversation engine — manages the adaptive interview flow.
 * Orchestrates AI responses, follow-ups, transitions, and wrap-up.
 */
import {
    respondToAnswer,
    generateIntro,
    generateTransition,
    generateWrapUp,
    evaluateCode,
} from "./gemini";

/**
 * Generate a warm intro for the interview session.
 */
export async function getIntro(topics, difficulty, questionCount) {
    try {
        const result = await generateIntro(topics, difficulty, questionCount);
        return result?.intro || `Hey! Welcome to your practice session. We've got ${questionCount} questions lined up — let's do this!`;
    } catch {
        return `Hi there! Let's get started with your practice interview. I've got ${questionCount} questions for you — nothing too scary, I promise!`;
    }
}

/**
 * Evaluate a user's answer and decide the next action.
 * Returns { score, response, action, followUpQuestion?, strengths, improvements }
 */
export async function evaluateAndDecide(question, answer, history, context, followUpCount, isLastQuestion) {
    try {
        const result = await respondToAnswer(question, answer, history, context);

        // Override action based on constraints
        let action = result?.action || "next_question";
        const score = result?.score ?? 5;

        // Pass through repeat_question and off_topic without overriding
        if (action === "repeat_question" || action === "off_topic") {
            return {
                score: 0,
                response: result?.response || (action === "repeat_question"
                    ? "Sure! Let me repeat that for you."
                    : "Let's focus back on the question."),
                action,
                followUpQuestion: null,
                strengths: [],
                improvements: [],
                keywordsFound: [],
                keywordsMissed: [],
            };
        }

        // Force next if follow-up limit reached
        if (action === "follow_up" && followUpCount >= 2) {
            action = "next_question";
        }

        // Force next if score is good
        if (score >= 6 && action === "follow_up") {
            action = "next_question";
        }

        // Force wrap-up on last question with no follow-ups needed
        if (isLastQuestion && action === "next_question") {
            action = "wrap_up";
        }

        return {
            score,
            response: result?.response || "Thanks for that answer! Let's keep going.",
            action,
            followUpQuestion: action === "follow_up" ? (result?.followUpQuestion || null) : null,
            strengths: result?.strengths || [],
            improvements: result?.improvements || [],
            keywordsFound: result?.keywordsFound || [],
            keywordsMissed: result?.keywordsMissed || [],
        };
    } catch (err) {
        console.warn("Conversational eval failed:", err.message);
        return {
            score: 5,
            response: "Got it, thanks for sharing your thoughts! Let's move on to the next one.",
            action: isLastQuestion ? "wrap_up" : "next_question",
            followUpQuestion: null,
            strengths: [],
            improvements: [],
            keywordsFound: [],
            keywordsMissed: [],
        };
    }
}

/**
 * Generate a phase transition (e.g., technical → behavioral).
 */
export async function getTransition(fromPhase, toPhase, scores) {
    const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 5;
    const performance = avgScore >= 7 ? "great" : avgScore >= 5 ? "decent" : "needs work";

    try {
        const result = await generateTransition(fromPhase, toPhase, performance);
        return result?.transition || `Alright, let's move on to some ${toPhase} questions!`;
    } catch {
        return `Great work on the ${fromPhase} section! Let's switch gears to ${toPhase} questions.`;
    }
}

/**
 * Generate a wrap-up summary.
 */
export async function getWrapUp(scores, topics) {
    try {
        const result = await generateWrapUp(scores, topics);
        return result?.wrapUp || "That wraps up our session! Great effort — keep practicing and you'll keep improving!";
    } catch {
        return "That's a wrap! You did well today. Keep reviewing the topics we covered and you'll be in great shape.";
    }
}

/**
 * Handle skip — returns a friendly skip message.
 */
export function getSkipResponse() {
    const messages = [
        "No worries at all! Let's move on to the next one.",
        "Totally fine — let's skip ahead and keep the momentum going!",
        "No problem! Let's try a different question.",
        "All good! Moving on to the next one.",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}
