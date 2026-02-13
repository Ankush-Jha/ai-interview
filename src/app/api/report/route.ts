import { NextRequest, NextResponse } from "next/server";
import {
    generateReport,
    Question,
    EvaluationResult,
} from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { questions, answers, scores, evaluations } = body as {
            questions: Question[];
            answers: string[];
            scores: number[];
            evaluations: EvaluationResult[];
        };

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json(
                { error: "Missing or invalid 'questions' array in request body." },
                { status: 400 }
            );
        }

        if (!answers || !Array.isArray(answers)) {
            return NextResponse.json(
                { error: "Missing or invalid 'answers' array in request body." },
                { status: 400 }
            );
        }

        const report = await generateReport({
            questions,
            answers,
            scores: scores || [],
            evaluations: evaluations || [],
        });

        return NextResponse.json({
            success: true,
            data: report,
        });
    } catch (error) {
        console.error("Report generation error:", error);
        const message =
            error instanceof Error ? error.message : "Failed to generate report.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
