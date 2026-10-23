import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { resolveSubject } from "@/lib/quiz";
import { getSubjectIcon } from "@/lib/subjects";
import { Quiz } from "@/components/Quiz";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string }>;
}): Promise<Metadata> {
  const { subject: slug } = await params;
  const subject = await resolveSubject(slug);
  const title = subject ? `${subject.name} Quiz · JAMB Practice` : "Quiz · JAMB Practice";
  const description = subject
    ? `15 ${subject.name} questions · 5 minutes · randomised every attempt. Can you score 100%?`
    : "Practise JAMB and WAEC questions.";
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

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ subject: string }>;
  searchParams: Promise<{ challenger?: string; score?: string; start?: string }>;
}) {
  const [{ subject: slug }, query] = await Promise.all([params, searchParams]);
  const subject = await resolveSubject(slug);
  if (!subject) notFound();

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <Image src="/logo.png" alt="Success Academy Logo" width={42} height={42} className="logo-img" priority />
          <div>
            <h1>SUCCESS ACADEMY</h1>
            <span>UTME LAB · JAMB/WAEC Practice</span>
          </div>
        </div>
        <div className="quiz-meta" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="subject-pill">
            <i className={`fa-solid ${subject.icon || getSubjectIcon(subject.slug)}`} style={{ marginRight: 6 }} />
            {subject.name}
          </span>
        </div>
      </header>
      <main className="container">
        <Quiz
          slug={subject.slug}
          name={subject.name}
          challenger={query?.challenger}
          challengeScore={query?.score}
          autoStart={query?.start === "1"}
        />
      </main>
    </>
  );
}
