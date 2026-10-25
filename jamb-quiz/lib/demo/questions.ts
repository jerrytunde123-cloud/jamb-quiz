export type DemoOption = {
  id: string
  text: string
}

export type DemoQuestion = {
  id: string
  subjectId: string
  subject: string
  topicId: string
  topic: string
  /** Calibrated difficulty, -3..+3. Kept for future engine wiring. */
  difficulty: number
  stem: string
  options: readonly DemoOption[]
  correctOptionId: string
  explanation: string
}

/**
 * Twenty hand-written sample questions for the practice-flow prototype.
 * They map to the demo blueprint in `catalog.ts`, but they are not a
 * question bank and have not been reviewed as exam content.
 *
 * Demo only: correct answers and explanations ship to the client so the
 * session can give instant feedback. Real content must validate answers
 * server-side.
 */
export const demoQuestions: readonly DemoQuestion[] = [
  {
    id: "eng-1",
    subjectId: "english",
    subject: "English Language",
    topicId: "eng-lexis",
    topic: "Lexis & structure",
    difficulty: -0.5,
    stem: 'Choose the word nearest in meaning to "meticulous".',
    options: [
      { id: "a", text: "Careless" },
      { id: "b", text: "Thorough" },
      { id: "c", text: "Quick" },
      { id: "d", text: "Stubborn" },
    ],
    correctOptionId: "b",
    explanation:
      "Meticulous means showing great attention to detail. Thorough is the closest meaning.",
  },
  {
    id: "math-1",
    subjectId: "mathematics",
    subject: "Mathematics",
    topicId: "math-algebra",
    topic: "Algebra",
    difficulty: -1,
    stem: "Solve for x: 2x + 3 = 11",
    options: [
      { id: "a", text: "2" },
      { id: "b", text: "4" },
      { id: "c", text: "7" },
      { id: "d", text: "14" },
    ],
    correctOptionId: "b",
    explanation:
      "Subtract 3 from both sides: 2x = 8. Divide by 2: x = 4.",
  },
  {
    id: "phy-1",
    subjectId: "physics",
    subject: "Physics",
    topicId: "phy-mechanics",
    topic: "Mechanics",
    difficulty: -0.5,
    stem: "A body moves 6 m north and then 8 m east. What is the magnitude of its displacement?",
    options: [
      { id: "a", text: "2 m" },
      { id: "b", text: "10 m" },
      { id: "c", text: "14 m" },
      { id: "d", text: "48 m" },
    ],
    correctOptionId: "b",
    explanation:
      "The two displacements are perpendicular, so use Pythagoras: √(6² + 8²) = √100 = 10 m.",
  },
  {
    id: "chem-1",
    subjectId: "chemistry",
    subject: "Chemistry",
    topicId: "chem-organic",
    topic: "Organic chemistry",
    difficulty: 0,
    stem: "Which of the following is an alkane?",
    options: [
      { id: "a", text: "C2H4" },
      { id: "b", text: "C2H6" },
      { id: "c", text: "C2H2" },
      { id: "d", text: "C6H6" },
    ],
    correctOptionId: "b",
    explanation:
      "Alkanes follow the general formula CnH2n+2. Ethane is C2H6, so it is an alkane.",
  },
  {
    id: "eng-2",
    subjectId: "english",
    subject: "English Language",
    topicId: "eng-grammar",
    topic: "Grammar & punctuation",
    difficulty: -1,
    stem: "Choose the correctly spelt word.",
    options: [
      { id: "a", text: "Occurence" },
      { id: "b", text: "Occurrence" },
      { id: "c", text: "Ocurrence" },
      { id: "d", text: "Occurrance" },
    ],
    correctOptionId: "b",
    explanation:
      "Occurrence has two c's and two r's: o-c-c-u-r-r-e-n-c-e.",
  },
  {
    id: "math-2",
    subjectId: "mathematics",
    subject: "Mathematics",
    topicId: "math-statistics",
    topic: "Statistics & probability",
    difficulty: 0,
    stem: "The mean of 4, 7, x and 10 is 8. Find x.",
    options: [
      { id: "a", text: "9" },
      { id: "b", text: "10" },
      { id: "c", text: "11" },
      { id: "d", text: "12" },
    ],
    correctOptionId: "c",
    explanation:
      "The mean is the total divided by 4. So (4 + 7 + x + 10) / 4 = 8. That gives 21 + x = 32, so x = 11.",
  },
  {
    id: "phy-2",
    subjectId: "physics",
    subject: "Physics",
    topicId: "phy-electricity",
    topic: "Electricity & magnetism",
    difficulty: -1.5,
    stem: "The SI unit of electric current is the:",
    options: [
      { id: "a", text: "Volt" },
      { id: "b", text: "Ampere" },
      { id: "c", text: "Ohm" },
      { id: "d", text: "Watt" },
    ],
    correctOptionId: "b",
    explanation:
      "Electric current is measured in amperes (A). Volts measure potential difference, ohms measure resistance, and watts measure power.",
  },
  {
    id: "chem-2",
    subjectId: "chemistry",
    subject: "Chemistry",
    topicId: "chem-physical",
    topic: "Physical chemistry",
    difficulty: -1,
    stem: "At 25°C, the pH of a neutral aqueous solution is:",
    options: [
      { id: "a", text: "0" },
      { id: "b", text: "7" },
      { id: "c", text: "14" },
      { id: "d", text: "1" },
    ],
    correctOptionId: "b",
    explanation:
      "In neutral water at 25°C, the concentrations of H+ and OH- are equal. That gives a pH of 7.",
  },
  {
    id: "eng-3",
    subjectId: "english",
    subject: "English Language",
    topicId: "eng-comprehension",
    topic: "Comprehension & summary",
    difficulty: -1,
    stem: 'In the sentence "The teacher\'s explanation was lucid", the word "lucid" means:',
    options: [
      { id: "a", text: "Confusing" },
      { id: "b", text: "Clear" },
      { id: "c", text: "Long" },
      { id: "d", text: "Boring" },
    ],
    correctOptionId: "b",
    explanation:
      "Lucid means easy to understand. A lucid explanation is clear.",
  },
  {
    id: "math-3",
    subjectId: "mathematics",
    subject: "Mathematics",
    topicId: "math-geometry",
    topic: "Geometry & trigonometry",
    difficulty: 0,
    stem: "A right-angled triangle has legs of 6 cm and 8 cm. What is the length of the hypotenuse?",
    options: [
      { id: "a", text: "10 cm" },
      { id: "b", text: "12 cm" },
      { id: "c", text: "14 cm" },
      { id: "d", text: "48 cm" },
    ],
    correctOptionId: "a",
    explanation:
      "Use Pythagoras' theorem: square both legs, add them, then take the square root. 6² + 8² = 100, and √100 = 10 cm.",
  },
  {
    id: "phy-3",
    subjectId: "physics",
    subject: "Physics",
    topicId: "phy-mechanics",
    topic: "Mechanics",
    difficulty: -1,
    stem: "Which of the following is a scalar quantity?",
    options: [
      { id: "a", text: "Force" },
      { id: "b", text: "Velocity" },
      { id: "c", text: "Displacement" },
      { id: "d", text: "Speed" },
    ],
    correctOptionId: "d",
    explanation:
      "A scalar has magnitude only. Speed is a scalar; force, velocity, and displacement are vectors.",
  },
  {
    id: "chem-3",
    subjectId: "chemistry",
    subject: "Chemistry",
    topicId: "chem-physical",
    topic: "Physical chemistry",
    difficulty: -1,
    stem: "The process by which a solid changes directly to a gas is called:",
    options: [
      { id: "a", text: "Melting" },
      { id: "b", text: "Sublimation" },
      { id: "c", text: "Condensation" },
      { id: "d", text: "Evaporation" },
    ],
    correctOptionId: "b",
    explanation:
      "Sublimation is the direct change from solid to gas, without passing through the liquid state.",
  },
  {
    id: "eng-4",
    subjectId: "english",
    subject: "English Language",
    topicId: "eng-grammar",
    topic: "Grammar & punctuation",
    difficulty: 0,
    stem: "Choose the option that best completes the sentence: Neither the teacher nor the students ___ arrived.",
    options: [
      { id: "a", text: "has" },
      { id: "b", text: "have" },
      { id: "c", text: "is" },
      { id: "d", text: "was" },
    ],
    correctOptionId: "b",
    explanation:
      "With neither...nor, the verb agrees with the nearer subject. 'Students' is plural, so 'have' is correct.",
  },
  {
    id: "math-4",
    subjectId: "mathematics",
    subject: "Mathematics",
    topicId: "math-algebra",
    topic: "Algebra",
    difficulty: -0.5,
    stem: "Simplify: 3(x + 2) - 2x",
    options: [
      { id: "a", text: "x + 6" },
      { id: "b", text: "5x + 6" },
      { id: "c", text: "x + 2" },
      { id: "d", text: "5x + 2" },
    ],
    correctOptionId: "a",
    explanation:
      "Expand the bracket: 3x + 6 - 2x. Then collect like terms: x + 6.",
  },
  {
    id: "phy-4",
    subjectId: "physics",
    subject: "Physics",
    topicId: "phy-electricity",
    topic: "Electricity & magnetism",
    difficulty: 0,
    stem: "The resistance of a wire is 4 Ω. If the potential difference across it is 12 V, what current flows?",
    options: [
      { id: "a", text: "0.33 A" },
      { id: "b", text: "3 A" },
      { id: "c", text: "8 A" },
      { id: "d", text: "48 A" },
    ],
    correctOptionId: "b",
    explanation:
      "Use Ohm's law: I = V / R. So I = 12 / 4 = 3 A.",
  },
  {
    id: "chem-4",
    subjectId: "chemistry",
    subject: "Chemistry",
    topicId: "chem-inorganic",
    topic: "Inorganic chemistry",
    difficulty: -0.5,
    stem: "Which gas is produced when dilute hydrochloric acid reacts with zinc?",
    options: [
      { id: "a", text: "Oxygen" },
      { id: "b", text: "Hydrogen" },
      { id: "c", text: "Carbon dioxide" },
      { id: "d", text: "Chlorine" },
    ],
    correctOptionId: "b",
    explanation:
      "Zinc reacts with dilute hydrochloric acid to form zinc chloride and hydrogen gas: Zn + 2HCl → ZnCl2 + H2.",
  },
  {
    id: "eng-5",
    subjectId: "english",
    subject: "English Language",
    topicId: "eng-lexis",
    topic: "Lexis & structure",
    difficulty: -0.5,
    stem: 'Choose the word opposite in meaning to "scarce".',
    options: [
      { id: "a", text: "Rare" },
      { id: "b", text: "Abundant" },
      { id: "c", text: "Expensive" },
      { id: "d", text: "Hidden" },
    ],
    correctOptionId: "b",
    explanation:
      "Scarce means in short supply. Abundant means plentiful, so it is the opposite.",
  },
  {
    id: "math-5",
    subjectId: "mathematics",
    subject: "Mathematics",
    topicId: "math-statistics",
    topic: "Statistics & probability",
    difficulty: -0.5,
    stem: "A bag contains 3 red and 2 blue balls. One ball is picked at random. What is the probability that it is red?",
    options: [
      { id: "a", text: "2/5" },
      { id: "b", text: "3/5" },
      { id: "c", text: "1/2" },
      { id: "d", text: "3/2" },
    ],
    correctOptionId: "b",
    explanation:
      "There are 3 red balls out of 5 balls in total. The probability is 3/5.",
  },
  {
    id: "phy-5",
    subjectId: "physics",
    subject: "Physics",
    topicId: "phy-waves",
    topic: "Waves & sound",
    difficulty: 0,
    stem: "A wave has a frequency of 50 Hz and a wavelength of 2 m. What is its speed?",
    options: [
      { id: "a", text: "25 m/s" },
      { id: "b", text: "52 m/s" },
      { id: "c", text: "100 m/s" },
      { id: "d", text: "200 m/s" },
    ],
    correctOptionId: "c",
    explanation:
      "Wave speed = frequency × wavelength. So v = 50 × 2 = 100 m/s.",
  },
  {
    id: "chem-5",
    subjectId: "chemistry",
    subject: "Chemistry",
    topicId: "chem-organic",
    topic: "Organic chemistry",
    difficulty: -0.5,
    stem: "The IUPAC name of CH3CH2OH is:",
    options: [
      { id: "a", text: "Ethanal" },
      { id: "b", text: "Ethanol" },
      { id: "c", text: "Ethanoic acid" },
      { id: "d", text: "Ethene" },
    ],
    correctOptionId: "b",
    explanation:
      "CH3CH2OH contains two carbon atoms and an -OH group, so it is ethanol.",
  },
]
