import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

export async function POST(req: NextRequest) {
    if (!apiKey) {
        return NextResponse.json(
            { error: "Server configuration error: GEMINI_API_KEY missing" },
            { status: 500 }
        );
    }

    try {
        const {
            fen,
            move,
            bestMove,
            evalBefore,
            evalAfter,
            topLines,
            moveNumber,
            side,
            playerRating
        } = await req.json();

        const prompt = `
      You are a chess coach explaining a move to a student.
      
      **Context:**
      - **Position FEN:** ${fen}
      - **Move Played:** ${side} played ${move} (Move number: ${moveNumber})
      - **Best Move Engine Recommendation:** ${bestMove}
      - **Evaluation Before Move:** ${evalBefore}
      - **Evaluation After Move:** ${evalAfter}
      - **Top Engine Lines:** ${JSON.stringify(topLines)}
      ${playerRating ? `- **Player Rating:** ${playerRating}` : ""}

      **Task:**
      Provide a concise, helpful, and educational explanation of the move played.
      - If the move was good, explain why it improves the position (space, piece activity, tactics, etc.).
      - If the move was bad (inaccuracy/mistake/blunder), explain WHY it is worse than the best move and what the player missed.
      - Keep the tone encouraging but objective.
      - Keep the response short (approx 2-3 sentences).
      - Do NOT use markdown bold/italic excessively.
      
      **Response:**
    `;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const text = result.text;

        return NextResponse.json({ explanation: text });
    } catch (error) {
        console.error("Error generating explanation:", error);
        return NextResponse.json(
            { error: "Failed to generate explanation" },
            { status: 500 }
        );
    }
}
