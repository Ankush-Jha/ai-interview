import { NextRequest, NextResponse } from "next/server";
import { evaluateAnswer, Question } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { question, userAnswer, context } = body as {
            question: Question;
            userAnswer: string;
            context: string;
        };

        if (!question || !question.question) {
            return NextResponse.json(
                { error: "Missing or invalid 'question' object in request body." },
                { status: 400 }
            );
        }

        if (!userAnswer || typeof userAnswer !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid 'userAnswer' field in request body." },
                { status: 400 }
            );
        }

        const evaluation = await evaluateAnswer(
            question,
            userAnswer,
            context || ""
        );

        return NextResponse.json({
            success: true,
            data: evaluation,
        });
    } catch (error) {
        console.error("Evaluation error:", error);
        const message =
            error instanceof Error ? error.message : "Failed to evaluate answer.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
