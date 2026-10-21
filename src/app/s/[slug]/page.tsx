import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveSubject } from "@/lib/quiz";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ challenger?: string; score?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const subject = await resolveSubject(slug);
  const name = subject?.name || "JAMB Practice";

  const challenger = query?.challenger?.trim();
  const score = query?.score?.trim();

  const title = challenger && score
    ? `⚔️ ${challenger} challenged you to beat ${score}/15 in JAMB ${name}! · UTME LAB`
    : `🔥 Take the JAMB ${name} Challenge · UTME LAB`;

  const description = challenger && score
    ? `${challenger} just scored ${score}/15 in JAMB ${name}. Can you step up and beat their score? 15 questions · 5 mins.`
    : `15 questions · 5 minutes. Real past questions. Challenge your friends and climb the leaderboard!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: "/logo.png", width: 500, height: 500, alt: "Success Academy" }],
    },
  };
}

/**
 * Viral share route.
 * Resolves the subject slug, preserves challenger & score query params,
 * and redirects to the homepage gate modal with the challenge banner.
 */
export default async function LegacyShareRoute({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const subject = await resolveSubject(slug);

  if (subject) {
    const q = new URLSearchParams();
    q.set("subject", subject.slug);
    if (query?.challenger) q.set("challenger", query.challenger.slice(0, 40));
    if (query?.score) q.set("score", query.score.slice(0, 10));
    redirect(`/?${q.toString()}`);
  }

  redirect("/");
}
