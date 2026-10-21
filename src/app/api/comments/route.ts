import { NextResponse } from "next/server";
import { addComment } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { subject?: string; name?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await addComment({
    subject: body.subject ?? "",
    name: body.name || "Guest",
    message: body.message ?? "",
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
