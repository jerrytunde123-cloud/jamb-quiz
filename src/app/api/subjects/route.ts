import { NextResponse } from "next/server";
import { getSubjects } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export async function GET() {
  const subjects = await getSubjects();
  return NextResponse.json(subjects, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400",
    },
  });
}
