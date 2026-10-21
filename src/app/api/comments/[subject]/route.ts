import { NextResponse } from "next/server";
import { getComments, resolveSubject } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ subject: string }> }
) {
  const { subject: slug } = await params;
  const subject = await resolveSubject(slug);
  return NextResponse.json(
    await getComments(subject?.slug ?? decodeURIComponent(slug))
  );
}
