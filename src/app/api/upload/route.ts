import { NextRequest, NextResponse } from "next/server";
import { parsePDF } from "@/lib/pdf-parser";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided. Please upload a PDF file." },
                { status: 400 }
            );
        }

        if (file.type !== "application/pdf") {
            return NextResponse.json(
                { error: "Invalid file type. Only PDF files are accepted." },
                { status: 400 }
            );
        }

        // 10 MB limit
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 10 MB." },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await parsePDF(buffer);

        if (!result.text || result.text.trim().length === 0) {
            return NextResponse.json(
                { error: "Could not extract text from this PDF. It may be scanned/image-only." },
                { status: 422 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                text: result.text,
                metadata: result.metadata,
                chunks: result.chunks,
                stats: {
                    totalCharacters: result.text.length,
                    estimatedTokens: Math.ceil(result.text.length / 4),
                    totalChunks: result.chunks.length,
                },
            },
        });
    } catch (error) {
        console.error("PDF upload error:", error);
        return NextResponse.json(
            { error: "Failed to process the PDF file. Please try again." },
            { status: 500 }
        );
    }
}
