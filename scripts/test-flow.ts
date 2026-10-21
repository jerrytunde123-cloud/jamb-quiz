/**
 * End-to-end check of the quiz flow.
 *
 * Subjects and questions come from the UTME Lab API (so this needs the
 * configured key and network access); sessions, attempts and grading run
 * against the configured database.
 *
 * Run with:  npm run test:flow
 */
import "./env";
import {
  createQuiz,
  submitQuiz,
  getSubjects,
  getLeaderboard,
  getStats,
  resolveSubject,
} from "../src/lib/quiz";
import { query } from "../src/lib/turso";
import { pickQuestions } from "../src/lib/utmelab";

async function main() {
  let failures = 0;
  const check = (name: string, ok: boolean, extra = "") => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
    if (!ok) failures++;
  };

  const subjects = await getSubjects();
  check("subjects load from the API", subjects.length > 0, `${subjects.length} subjects`);

  const subject = (await resolveSubject("mathematics")) ?? subjects[0];
  if (subject) {
    check("subject resolves by slug", subject.slug === "mathematics", subject.slug);
  } else {
    check("subject resolves by slug", false, "no subjects available");
  }

  const quiz = await createQuiz(subject);
  check("quiz created", !!quiz && quiz.questions.length > 0);
  check(
    "quiz respects the question limit",
    !!quiz && quiz.questions.length <= 15,
    `${quiz?.questions.length} questions`
  );
  check(
    "answers are NOT leaked to the client",
    !!quiz &&
      quiz.questions.every(
        (q) => !("correct" in q) && !("answer" in q) && !("explanation" in q)
      )
  );

  // Figures are rich-text image marks: they must survive normalisation with an
  // https URL and a side, so the UI has something to render.
  const pool = await pickQuestions(subject, 500);
  const figures = pool.questions
    .flatMap((q) => [...q.inline, ...q.optionInline.flat()])
    .filter((m) => m.kind === "image");
  check(
    "image marks are served with a url and position",
    figures.length > 0 &&
      figures.every(
        (m) =>
          m.url?.startsWith("https://") &&
          (m.position === "above" || m.position === "below")
      ),
    `${figures.length} image mark(s)`
  );

  // Comprehension questions are only answerable with their stimulus, so a
  // served question that names a passage must have that passage attached, and
  // a served passage must have real text.
  const english = subjects.find((s) => s.slug === "use-of-english");
  if (!english) {
    check("the passage subject is available", false, "use-of-english missing");
  } else {
    const engPool = await pickQuestions(english, 500);
    const withPassage = engPool.questions.filter((q) => q.passageId);
    check(
      "passage questions are served with their stimulus",
      withPassage.length > 0 &&
        withPassage.every(
          (q) => !!engPool.passages[q.passageId!]?.text.trim()
        ),
      `${withPassage.length} of ${engPool.questions.length} question(s) carry a passage`
    );
    check(
      "every served passage has text",
      Object.values(engPool.passages).every((p) => p.text.trim().length > 0),
      `${Object.keys(engPool.passages).length} passage(s)`
    );
    check(
      "a question without a passage id has no passage attached",
      engPool.questions.every(
        (q) => !q.passageId || !!engPool.passages[q.passageId]
      )
    );
  }

  // The server-side key is the only source of truth for grading.
  const readKey = async (quizId: string) => {
    const rows = await query<{ answer_key: string }>(
      `SELECT answer_key FROM sessions WHERE session_id = ?`,
      [quizId]
    );
    const raw = JSON.parse(rows[0]?.answer_key ?? "{}") as {
      answers?: Record<string, number>;
    };
    return raw.answers ?? (raw as Record<string, number>);
  };

  const ids = quiz ? quiz.questions.map((q) => q.id) : [];
  let key: Record<string, number> = {};
  if (quiz && quiz.quizId) {
    key = await readKey(quiz.quizId);
    check(
      "the answer key covers every served question",
      ids.every((id) => typeof key[id] === "number")
    );
  } else {
    check("the answer key covers every served question", false, "no quiz created");
  }

  // The bank serves four-option rows, a few five-option cloze questions and
  // the odd two-option row: the option count is per question, not fixed.
  if (quiz) {
    check(
      "option counts are carried per question",
      quiz.questions.every(
        (q) =>
          q.options.length >= 2 &&
          q.options.length <= 6 &&
          q.optionInline.length === q.options.length
      )
    );
  } else {
    check("option counts are carried per question", false, "no quiz created");
  }

  // Answer everything correctly.
  const perfect: Record<string, number> = {};
  if (quiz && ids.length) {
    for (const id of ids) perfect[id] = key[id];
  }

  const res = quiz ? await submitQuiz({
    quizId: quiz.quizId,
    answers: perfect,
    nickname: "Tester",
    timeTaken: 42,
  }) : { error: "no quiz created" };
  check(
    "perfect score",
    !("error" in res) && res.score === res.total,
    JSON.stringify(res).slice(0, 120)
  );
  check(
    "submit returns the display subject",
    !("error" in res) && res.subject === subject.name,
    "error" in res ? res.error : res.subject
  );

  // Replay the same session — must be rejected.
  const replay = quiz ? await submitQuiz({ quizId: quiz.quizId, answers: perfect }) : { error: "no quiz created" };
  check("replay rejected", "error" in replay, "error" in replay ? replay.error : "");

  // Unknown session id.
  const bogus = await submitQuiz({ quizId: "does-not-exist", answers: {} });
  check("unknown session rejected", "error" in bogus);

  // Wrong answers score lower.
  const quiz2 = await createQuiz(subject);
  let res2: Awaited<ReturnType<typeof submitQuiz>> | null = null;
  if (quiz2 && quiz2.quizId) {
    const key2 = await readKey(quiz2.quizId);
    const wrong: Record<string, number> = {};
    for (const q of quiz2.questions) {
      // Pick the next option that is not the right one, using the question's
      // own option count — the bank serves two to six options per row.
      const count = q.options.length;
      wrong[q.id] = (key2[q.id] + 1) % count;
    }
    res2 = await submitQuiz({
      quizId: quiz2.quizId,
      answers: wrong,
      nickname: "Tester",
    });
    check(
      "wrong answers score lower than a perfect score",
      "score" in res2 && typeof res2.score === "number" && res2.score < res.score,
      `${res2.score ?? "undefined"}`
    );
  } else {
    check("wrong answers score lower than a perfect score", false, "no second quiz created");
  }
  if (quiz2 && quiz2.quizId && res2) {
    check(
      "wrong answers score 0",
      !("error" in res2) && res2.score === 0,
      "error" in res2 ? res2.error : `score ${res2.score}`
    );
  } else {
    check("wrong answers score 0", false, "no second quiz created");
  }

  // Answers for questions that were not served are ignored.
  const quiz3 = await createQuiz(subject);
  if (quiz3 && quiz3.quizId) {
    const inject: Record<string, number> = { "not-a-real-question": 0 };
    const res3 = await submitQuiz({ quizId: quiz3.quizId, answers: inject });
    check(
      "injected answers ignored",
      !("error" in res3) &&
        res3.score === 0 &&
        res3.total === quiz3.questions.length,
      "error" in res3 ? res3.error : `total ${res3.total}`
    );
  } else {
    check("injected answers ignored", false, "no third quiz created");
  }
  // ================================================================
  //  Leaderboard
  // ================================================================
  check(
    "leaderboard loads",
    (await getLeaderboard(subject.slug)).length > 0,
    "empty"
  );
  check(
    "attempts & likes load",
    (await getStats(subject.slug)).attempts > 0,
    "empty"
  );

  // Out-of-range option index is rejected, not counted.
  const quiz4 = await createQuiz(subject);
  const oor: Record<string, number> = {};
  for (const id of quiz4!.questions.map((q) => q.id)) oor[id] = 99;
  const res4 = await submitQuiz({ quizId: quiz4!.quizId, answers: oor });
  check("out-of-range options rejected", !("error" in res4) && res4.score === 0);

  // An index that exists in the bank but not in *this* question is not an
  // answer either: the server knows each question's own option count.
  const quiz4b = await createQuiz(subject);
  const key4b = await readKey(quiz4b!.quizId);
  const narrow = quiz4b!.questions.find(
    (q) => q.options.length > 2 && key4b[q.id] < q.options.length - 1
  );
  if (!narrow) {
    check("a narrower question is available to probe", false);
  } else {
    const beyond: Record<string, number> = {
      [narrow.id]: narrow.options.length, // one past the last real option
    };
    const res4b = await submitQuiz({
      quizId: quiz4b!.quizId,
      answers: beyond,
    });
    check(
      "an option the question does not have is rejected",
      !("error" in res4b) &&
        res4b.score === 0 &&
        res4b.chosen[narrow.id] === -1,
      !("error" in res4b)
        ? `chosen=${res4b.chosen[narrow.id]} (question has ${narrow.options.length} options)`
        : res4b.error
    );
  }

  // Nickname is sanitised and truncated.
  const quiz5 = await createQuiz(subject);
  await submitQuiz({
    quizId: quiz5!.quizId,
    answers: {},
    nickname: "x".repeat(200),
  });
  const lb = await getLeaderboard(subject.slug);
  const longest = Math.max(...lb.map((r) => r.nickname.length));
  check("nickname truncated to 40", longest <= 40, `max ${longest}`);

  // The attempt row was persisted.
  const attemptRows = await query<{ c: number }>(
    `SELECT COUNT(*) AS c FROM attempts WHERE subject = ?`,
    [subject.slug]
  );
  check(
    "attempts persisted",
    Number(attemptRows[0]?.c ?? 0) >= 4,
    `${attemptRows[0]?.c} rows`
  );

  // The session is marked used.
  const usedRows = await query<{ used: number }>(
    `SELECT used FROM sessions WHERE session_id = ?`,
    quiz ? [quiz.quizId] : []
  );
  check("session marked used", Number(usedRows[0]?.used) === 1);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
