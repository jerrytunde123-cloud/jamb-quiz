import { Home } from "@/components/home/home"
import { getSubjects } from "@/lib/quiz/service"
import { sortSubjects } from "@/lib/quiz/subject-meta"

export async function SubjectBrowser() {
  const subjects = sortSubjects(await getSubjects())
  return <Home subjects={subjects} />
}
