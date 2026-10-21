import { NextResponse } from "next/server";
import { likeSubject, resolveSubject } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ subject: string }> }
) {
  const { subject: slug } = await params;
  const subject = await resolveSubject(slug);
  const likes = await likeSubject(subject?.slug ?? decodeURIComponent(slug));
  return NextResponse.json({ likes });
}
