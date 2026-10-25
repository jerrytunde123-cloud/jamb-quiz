import type { Subject } from "../readiness"

/**
 * Demo blueprint. Weights are illustrative, not the official JAMB syllabus.
 * They exist so the engine has realistic breadth to reason about.
 */
export const demoSubjects: readonly Subject[] = [
  {
    id: "english",
    name: "English Language",
    blueprintQuestions: 60,
    topics: [
      {
        id: "eng-comprehension",
        subjectId: "english",
        name: "Comprehension & summary",
        blueprintWeight: 0.3,
      },
      {
        id: "eng-lexis",
        subjectId: "english",
        name: "Lexis & structure",
        blueprintWeight: 0.25,
      },
      {
        id: "eng-oral",
        subjectId: "english",
        name: "Oral forms",
        blueprintWeight: 0.2,
      },
      {
        id: "eng-grammar",
        subjectId: "english",
        name: "Grammar & punctuation",
        blueprintWeight: 0.25,
      },
    ],
  },
  {
    id: "mathematics",
    name: "Mathematics",
    blueprintQuestions: 40,
    topics: [
      {
        id: "math-number",
        subjectId: "mathematics",
        name: "Number & numeration",
        blueprintWeight: 0.15,
      },
      {
        id: "math-algebra",
        subjectId: "mathematics",
        name: "Algebra",
        blueprintWeight: 0.25,
      },
      {
        id: "math-geometry",
        subjectId: "mathematics",
        name: "Geometry & trigonometry",
        blueprintWeight: 0.25,
      },
      {
        id: "math-calculus",
        subjectId: "mathematics",
        name: "Calculus",
        blueprintWeight: 0.2,
      },
      {
        id: "math-statistics",
        subjectId: "mathematics",
        name: "Statistics & probability",
        blueprintWeight: 0.15,
      },
    ],
  },
  {
    id: "physics",
    name: "Physics",
    blueprintQuestions: 40,
    topics: [
      {
        id: "phy-mechanics",
        subjectId: "physics",
        name: "Mechanics",
        blueprintWeight: 0.25,
      },
      {
        id: "phy-waves",
        subjectId: "physics",
        name: "Waves & sound",
        blueprintWeight: 0.2,
      },
      {
        id: "phy-electricity",
        subjectId: "physics",
        name: "Electricity & magnetism",
        blueprintWeight: 0.25,
      },
      {
        id: "phy-optics",
        subjectId: "physics",
        name: "Optics",
        blueprintWeight: 0.15,
      },
      {
        id: "phy-modern",
        subjectId: "physics",
        name: "Modern physics",
        blueprintWeight: 0.15,
      },
    ],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    blueprintQuestions: 40,
    topics: [
      {
        id: "chem-organic",
        subjectId: "chemistry",
        name: "Organic chemistry",
        blueprintWeight: 0.3,
      },
      {
        id: "chem-inorganic",
        subjectId: "chemistry",
        name: "Inorganic chemistry",
        blueprintWeight: 0.25,
      },
      {
        id: "chem-physical",
        subjectId: "chemistry",
        name: "Physical chemistry",
        blueprintWeight: 0.25,
      },
      {
        id: "chem-analytical",
        subjectId: "chemistry",
        name: "Analytical chemistry",
        blueprintWeight: 0.2,
      },
    ],
  },
]

export const DEMO_PROFILE = {
  englishSubjectId: "english",
  selectedSubjectIds: ["mathematics", "physics", "chemistry"],
} as const

export const DEMO_STUDENT = {
  name: "Jerry",
  streakDays: 12,
  label: "UTME candidate",
} as const
