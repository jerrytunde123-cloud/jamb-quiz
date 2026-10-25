import { redirect } from "next/navigation"

/** The parent app's subject picker is the home page. */
export default function QuizHomePage() {
  redirect("/")
}
