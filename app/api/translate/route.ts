import { NextRequest, NextResponse } from "next/server";
// import OpenAI from "openai";

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
// });

export async function POST(req: NextRequest) {
    try {
        const { texts, targetLanguage } = await req.json();

        if (!Array.isArray(texts) || typeof targetLanguage !== "string") {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 },
            );
        }

        // if (!process.env.OPENAI_API_KEY) {
        //     return NextResponse.json(
        //         { error: "OPENAI_API_KEY is not set on the server" },
        //         { status: 500 },
        //     );
        // }

        // // We ask the model to return a pure JSON array of translated strings
        // const completion = await openai.chat.completions.create({
        //     model: "gpt-4o-mini", // or any other model you prefer
        //     messages: [
        //         {
        //             role: "system",
        //             content:
        //                 "You are a translation engine for UI labels. " +
        //                 "Translate each string into the target language. " +
        //                 "Return ONLY a JSON array of translated strings, in the same order, no extra text.",
        //         },
        //         {
        //             role: "user",
        //             content: JSON.stringify({
        //                 targetLanguage,
        //                 texts,
        //             }),
        //         },
        //     ],
        //     temperature: 0,
        // });

        // const content = completion.choices[0]?.message?.content ?? "[]";

        // content should be a JSON array like ["Texto 1", "Texto 2", ...]
        let translatedTexts: string[] = [];
        try {
            // translatedTexts = JSON.parse(content);
        } catch (e) {
            // console.error("Failed to parse translation JSON:", content);
            return NextResponse.json(
                { error: "Failed to parse translation response" },
                { status: 500 },
            );
        }

        return NextResponse.json({ translatedTexts });
    } catch (err) {
        console.error("Error in /api/translate:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
