import { describe, expect, it } from "vitest"

import { demoSubjects } from "./catalog"
import { demoQuestions } from "./questions"

const subjectById = new Map(
  demoSubjects.map((subject) => [subject.id, subject])
)

describe("demo questions", () => {
  it("has twenty uniquely identified questions", () => {
    expect(demoQuestions).toHaveLength(20)
    expect(new Set(demoQuestions.map((question) => question.id)).size).toBe(
      20
    )
  })

  it.each(demoQuestions)("$id has a complete question shape", (question) => {
    expect(question.stem.length).toBeGreaterThan(0)
    expect(question.explanation.length).toBeGreaterThan(0)
    expect(question.options).toHaveLength(4)
    expect(new Set(question.options.map((option) => option.id)).size).toBe(4)
    expect(
      question.options.some(
        (option) => option.id === question.correctOptionId
      )
    ).toBe(true)
  })

  it.each(demoQuestions)("$id maps to the demo blueprint", (question) => {
    const subject = subjectById.get(question.subjectId)

    expect(subject).toBeDefined()
    expect(subject?.name).toBe(question.subject)

    const topic = subject?.topics.find(
      (item) => item.id === question.topicId
    )

    expect(topic).toBeDefined()
    expect(topic?.name).toBe(question.topic)
  })
})
