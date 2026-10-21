import { NextResponse } from "next/server";
import { getStats, resolveSubject } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ subject: string }> }
) {
  const { subject: slug } = await params;
  const subject = await resolveSubject(slug);
  return NextResponse.json(
    await getStats(subject?.slug ?? decodeURIComponent(slug))
  );
}
