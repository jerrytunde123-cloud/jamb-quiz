import { NextResponse } from "next/server";
import { submitQuiz } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: {
    quizId?: string;
    answers?: Record<string, number>;
    nickname?: string;
    timeTaken?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await submitQuiz({
    quizId: body.quizId ?? "",
    answers: body.answers ?? {},
    nickname: body.nickname,
    timeTaken: body.timeTaken,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
