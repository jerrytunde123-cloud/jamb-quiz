/**
 * Subject metadata: Icons and priority rankings.
 *
 * JAMB candidates in Nigeria take Use of English (compulsory for ALL) plus
 * 3 subjects depending on their course (STEM, Commercial, Arts, etc.).
 *
 * This mapping defines:
 *  1. Priority order (Rank): Important & common subjects first, less common last.
 *  2. FontAwesome icon class for each subject.
 */

export interface SubjectMeta {
  icon: string;
  rank: number;
  category:
    | "Compulsory"
    | "Core Sciences"
    | "Social Sciences & Commercial"
    | "Arts & Humanities"
    | "Vocational & Applied"
    | "Languages & Electives";
}

/**
 * Standard subject knowledge mapped by API slug and common aliases.
 */
export const SUBJECT_METADATA: Record<string, SubjectMeta> = {
  // 1. Compulsory for EVERY student in Nigeria
  "use-of-english": {
    icon: "fa-font",
    rank: 1,
    category: "Compulsory",
  },
  "english-language": {
    icon: "fa-font",
    rank: 1,
    category: "Compulsory",
  },

  // 2. Core STEM & Sciences
  mathematics: {
    icon: "fa-calculator",
    rank: 2,
    category: "Core Sciences",
  },
  "general-mathematics": {
    icon: "fa-calculator",
    rank: 2,
    category: "Core Sciences",
  },
  biology: {
    icon: "fa-dna",
    rank: 3,
    category: "Core Sciences",
  },
  chemistry: {
    icon: "fa-flask",
    rank: 4,
    category: "Core Sciences",
  },
  physics: {
    icon: "fa-atom",
    rank: 5,
    category: "Core Sciences",
  },

  // 3. Core Social Sciences & Commercial
  economics: {
    icon: "fa-chart-line",
    rank: 6,
    category: "Social Sciences & Commercial",
  },
  government: {
    icon: "fa-gavel",
    rank: 7,
    category: "Social Sciences & Commercial",
  },
  commerce: {
    icon: "fa-store",
    rank: 8,
    category: "Social Sciences & Commercial",
  },
  "principles-of-accounts": {
    icon: "fa-coins",
    rank: 9,
    category: "Social Sciences & Commercial",
  },
  "financial-accounting": {
    icon: "fa-coins",
    rank: 9,
    category: "Social Sciences & Commercial",
  },

  // 4. Core Arts & Humanities
  "literature-in-english": {
    icon: "fa-feather-alt",
    rank: 10,
    category: "Arts & Humanities",
  },
  "christian-religious-studies": {
    icon: "fa-bible",
    rank: 11,
    category: "Arts & Humanities",
  },
  "islamic-religious-studies": {
    icon: "fa-moon",
    rank: 12,
    category: "Arts & Humanities",
  },
  geography: {
    icon: "fa-globe-africa",
    rank: 13,
    category: "Core Sciences",
  },

  // 5. Vocational, Applied & Technology
  "agricultural-science": {
    icon: "fa-leaf",
    rank: 14,
    category: "Vocational & Applied",
  },
  "computer-studies": {
    icon: "fa-laptop-code",
    rank: 15,
    category: "Vocational & Applied",
  },
  "data-processing": {
    icon: "fa-database",
    rank: 16,
    category: "Vocational & Applied",
  },
  "civic-education": {
    icon: "fa-landmark",
    rank: 17,
    category: "Social Sciences & Commercial",
  },
  history: {
    icon: "fa-landmark",
    rank: 18,
    category: "Arts & Humanities",
  },
  art: {
    icon: "fa-palette",
    rank: 19,
    category: "Arts & Humanities",
  },
  "fine-arts": {
    icon: "fa-palette",
    rank: 19,
    category: "Arts & Humanities",
  },
  "visual-arts": {
    icon: "fa-palette",
    rank: 19,
    category: "Arts & Humanities",
  },
  "home-economics": {
    icon: "fa-home",
    rank: 20,
    category: "Vocational & Applied",
  },
  "catering-craft-practice": {
    icon: "fa-utensils",
    rank: 21,
    category: "Vocational & Applied",
  },
  "animal-husbandry": {
    icon: "fa-paw",
    rank: 22,
    category: "Vocational & Applied",
  },
  "further-mathematics": {
    icon: "fa-square-root-variable",
    rank: 23,
    category: "Core Sciences",
  },
  insurance: {
    icon: "fa-shield-alt",
    rank: 24,
    category: "Social Sciences & Commercial",
  },
  marketing: {
    icon: "fa-bullhorn",
    rank: 25,
    category: "Social Sciences & Commercial",
  },
  "office-practice": {
    icon: "fa-briefcase",
    rank: 26,
    category: "Social Sciences & Commercial",
  },
  "physical-education": {
    icon: "fa-running",
    rank: 27,
    category: "Vocational & Applied",
  },

  // 6. Languages & Electives
  french: {
    icon: "fa-language",
    rank: 30,
    category: "Languages & Electives",
  },
  hausa: {
    icon: "fa-language",
    rank: 31,
    category: "Languages & Electives",
  },
  igbo: {
    icon: "fa-language",
    rank: 32,
    category: "Languages & Electives",
  },
  yoruba: {
    icon: "fa-language",
    rank: 33,
    category: "Languages & Electives",
  },
  arabic: {
    icon: "fa-language",
    rank: 34,
    category: "Languages & Electives",
  },
  music: {
    icon: "fa-music",
    rank: 35,
    category: "Arts & Humanities",
  },
};

/** Normalize any subject identifier (slug or name) into a key. */
function normalizeKey(slugOrName: string): string {
  return slugOrName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Get the icon class for a subject slug or name. Defaults to 'fa-book'. */
export function getSubjectIcon(slugOrName: string): string {
  const key = normalizeKey(slugOrName);
  return SUBJECT_METADATA[key]?.icon ?? "fa-book";
}

/** Get the priority rank for sorting. Defaults to 100 for unknown subjects. */
export function getSubjectRank(slugOrName: string): number {
  const key = normalizeKey(slugOrName);
  return SUBJECT_METADATA[key]?.rank ?? 100;
}

/**
 * Sort subjects: Important & common first, less common last,
 * then alphabetically by name for ties.
 */
export function sortSubjects<T extends { slug: string; name?: string }>(
  subjects: T[]
): T[] {
  return [...subjects].sort((a, b) => {
    const rankA = getSubjectRank(a.slug);
    const rankB = getSubjectRank(b.slug);
    if (rankA !== rankB) return rankA - rankB;
    return (a.name ?? a.slug).localeCompare(b.name ?? b.slug);
  });
}
