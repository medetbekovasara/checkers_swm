import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createLocalCoachReport } from "@/services/ai/coach";
import type { GameState } from "@/game-engine";

export async function POST(request: Request) {
  const { game } = await request.json() as { game: GameState };

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(createLocalCoachReport(game));
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_COACH_MODEL ?? "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "Return concise JSON with summary:string, advice:string[], style:string for a checkers post-game coach.",
          "Analyze risky moves, missed captures, defense, aggression, endgame conversion, and chaos side swaps when present.",
          "Keep advice practical, short, and specific. Do not exceed 4 advice items."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          mode: game.mode,
          winner: game.winner,
          moves: game.moves,
          chaosLog: game.chaosLog
        })
      }
    ]
  });

  const content = completion.choices[0]?.message.content;
  if (!content) return NextResponse.json(createLocalCoachReport(game));

  return NextResponse.json(JSON.parse(content));
}
