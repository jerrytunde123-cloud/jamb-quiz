export type QuizSubjectIcon =
  | "book-open"
  | "calculator"
  | "atom"
  | "flask"
  | "dna"
  | "trending-up"
  | "landmark"
  | "book-marked"

export type QuizSubject = {
  slug: string
  name: string
  tagline: string
  icon: QuizSubjectIcon
  compulsory?: boolean
}

/**
 * A small static catalogue for the gate slice. The real subject list will
 * come from the question-bank API when the quiz loop is ported.
 */
export const QUIZ_SUBJECTS: readonly QuizSubject[] = [
  {
    slug: "use-of-english",
    name: "Use of English",
    tagline: "Comprehension, lexis, and oral forms",
    icon: "book-open",
    compulsory: true,
  },
  {
    slug: "mathematics",
    name: "Mathematics",
    tagline: "Algebra, geometry, and calculus",
    icon: "calculator",
  },
  {
    slug: "physics",
    name: "Physics",
    tagline: "Mechanics, waves, and electricity",
    icon: "atom",
  },
  {
    slug: "chemistry",
    name: "Chemistry",
    tagline: "Organic, inorganic, and physical",
    icon: "flask",
  },
  {
    slug: "biology",
    name: "Biology",
    tagline: "Cells, genetics, and ecology",
    icon: "dna",
  },
  {
    slug: "economics",
    name: "Economics",
    tagline: "Micro, macro, and markets",
    icon: "trending-up",
  },
  {
    slug: "government",
    name: "Government",
    tagline: "Constitution, politics, and civics",
    icon: "landmark",
  },
  {
    slug: "literature-in-english",
    name: "Literature in English",
    tagline: "Drama, prose, and poetry",
    icon: "book-marked",
  },
]

export function getQuizSubject(slug: string): QuizSubject | null {
  return QUIZ_SUBJECTS.find((subject) => subject.slug === slug) ?? null
}
