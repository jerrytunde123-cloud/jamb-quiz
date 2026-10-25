import { SubjectGrid } from "@/components/shell/subject-grid"
import { getSubjects } from "@/lib/quiz/service"
import { sortSubjects } from "@/lib/quiz/subject-meta"

export async function SubjectBrowser() {
  const subjects = sortSubjects(await getSubjects())
  return <SubjectGrid subjects={subjects} />
}
