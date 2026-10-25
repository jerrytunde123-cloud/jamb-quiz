import {
  Activity,
  Atom,
  BookOpen,
  Briefcase,
  Calculator,
  Church,
  Coins,
  Cpu,
  Database,
  Dna,
  Feather,
  FlaskConical,
  Globe2,
  Home,
  Landmark,
  Languages,
  Leaf,
  Megaphone,
  MoonStar,
  Music,
  Palette,
  PawPrint,
  ShieldCheck,
  SquareFunction,
  Store,
  TrendingUp,
  Utensils,
  type LucideIcon,
} from "lucide-react"

const SUBJECT_ICONS: Record<string, LucideIcon> = {
  "use-of-english": BookOpen,
  "english-language": BookOpen,
  mathematics: Calculator,
  "general-mathematics": Calculator,
  "further-mathematics": SquareFunction,
  physics: Atom,
  chemistry: FlaskConical,
  biology: Dna,
  economics: TrendingUp,
  government: Landmark,
  commerce: Store,
  "principles-of-accounts": Coins,
  "financial-accounting": Coins,
  "literature-in-english": Feather,
  "christian-religious-studies": Church,
  "islamic-religious-studies": MoonStar,
  geography: Globe2,
  "agricultural-science": Leaf,
  "computer-studies": Cpu,
  "data-processing": Database,
  "civic-education": Landmark,
  history: Landmark,
  art: Palette,
  "fine-arts": Palette,
  "visual-arts": Palette,
  "home-economics": Home,
  "catering-craft-practice": Utensils,
  "animal-husbandry": PawPrint,
  insurance: ShieldCheck,
  marketing: Megaphone,
  "office-practice": Briefcase,
  "physical-education": Activity,
  french: Languages,
  hausa: Languages,
  igbo: Languages,
  yoruba: Languages,
  arabic: Languages,
  music: Music,
}

function iconKey(slugOrName: string): string {
  return slugOrName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function SubjectIcon({
  subject,
  className,
}: {
  subject: string
  className?: string
}) {
  const Icon = SUBJECT_ICONS[iconKey(subject)] ?? BookOpen
  return <Icon className={className} aria-hidden="true" />
}
