import { NextRequest, NextResponse } from "next/server";
import { generateQuestions, QuestionConfig } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { content, config } = body as {
            content: string;
            config: Partial<QuestionConfig>;
        };

        if (!content || typeof content !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid 'content' field in request body." },
                { status: 400 }
            );
        }

        // Merge with defaults
        const questionConfig: QuestionConfig = {
            difficulty: config?.difficulty ?? "mixed",
            count: Math.min(Math.max(config?.count ?? 5, 1), 20), // clamp 1–20
            types: config?.types ?? ["mcq", "open-ended"],
            persona: config?.persona ?? "quiz-master",
        };

        const questions = await generateQuestions(content, questionConfig);

        return NextResponse.json({
            success: true,
            data: {
                questions,
                config: questionConfig,
            },
        });
    } catch (error) {
        console.error("Question generation error:", error);
        const message =
            error instanceof Error ? error.message : "Failed to generate questions.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
