import { NextResponse } from "next/server";
import { createQuiz, resolveSubject } from "@/lib/quiz/service";
import { UtmeLabError } from "@/lib/quiz/utmelab";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ subject: string }> }
) {
  const { subject: slug } = await params;
  const subject = await resolveSubject(slug);
  if (!subject) {
    return NextResponse.json({ error: "No questions for this subject" }, { status: 404 });
  }

  try {
    const quiz = await createQuiz(subject);
    if (!quiz) {
      return NextResponse.json(
        { error: "No questions for this subject" },
        { status: 404 }
      );
    }
    return NextResponse.json(quiz);
  } catch (err) {
    console.error(
      "[quiz] could not fetch questions:",
      err instanceof Error ? err.message : err
    );
    const status = err instanceof UtmeLabError && err.status === 429 ? 429 : 503;
    return NextResponse.json(
      {
        error:
          status === 429
            ? "The question bank is busy right now. Try again in a moment."
            : "The question bank is unavailable right now. Try again shortly.",
      },
      { status }
    );
  }
}
