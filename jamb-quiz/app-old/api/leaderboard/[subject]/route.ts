import { NextResponse } from "next/server";
import { getLeaderboard, resolveSubject } from "@/lib/quiz/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ subject: string }> }
) {
  const { subject: slug } = await params;
  const subject = await resolveSubject(slug);
  return NextResponse.json(
    await getLeaderboard(subject?.slug ?? decodeURIComponent(slug))
  );
}
