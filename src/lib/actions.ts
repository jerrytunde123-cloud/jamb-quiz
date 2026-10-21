"use server";

import {
  submitQuiz,
  likeSubject,
  addComment,
  createQuiz,
  resolveSubject,
} from "./quiz";
import type { QuizPayload, SubmitResult } from "./types";

/**
 * Server Action: Grade a submitted quiz attempt.
 *
 * Scoring happens strictly server-side using the answer key stored in the session.
 */
export async function submitQuizAction(input: {
  quizId: string;
  answers: Record<string, number>;
  nickname?: string;
  timeTaken?: number;
  userId?: string | null;
}): Promise<SubmitResult | { error: string }> {
  return await submitQuiz(input);
}

/**
 * Server Action: Increment the like counter for a subject.
 */
export async function likeSubjectAction(subject: string): Promise<number> {
  return await likeSubject(subject);
}

/**
 * Server Action: Add a comment to a subject wall.
 */
export async function addCommentAction(input: {
  subject: string;
  name?: string;
  message: string;
  userId?: string | null;
}): Promise<{ error: string } | { ok: true }> {
  return await addComment(input);
}

/**
 * Server Action: Start a fresh quiz session for a subject slug.
 *
 * Conceals the answer key on the server and returns only the public questions.
 */
export async function startQuizAction(
  slug: string
): Promise<QuizPayload | { error: string }> {
  const subject = await resolveSubject(slug);
  if (!subject) return { error: "Subject not found" };
  const quiz = await createQuiz(subject);
  if (!quiz) return { error: "No questions available for this subject" };
  return quiz;
}
