import { NextRequest, NextResponse } from "next/server";
import { analyzeContent } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text } = body;

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid 'text' field in request body." },
                { status: 400 }
            );
        }

        if (text.trim().length < 100) {
            return NextResponse.json(
                { error: "Text content is too short for meaningful analysis (minimum 100 characters)." },
                { status: 400 }
            );
        }

        const analysis = await analyzeContent(text);

        return NextResponse.json({
            success: true,
            data: analysis,
        });
    } catch (error) {
        console.error("Analysis error:", error);
        const message =
            error instanceof Error ? error.message : "Failed to analyze content.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
