import { describe, expect, it } from "vitest";
import { rankQuestions, type Question } from "../../src/features/qa/QaBoard";

const questions: Question[] = [
  { id: "older-open", text: "Older open", ts: 10, answered: false },
  { id: "popular-open", text: "Popular open", ts: 20, answered: false },
  { id: "covered", text: "Covered", ts: 1, answered: true },
];

describe("rankQuestions", () => {
  it("keeps open questions first, then orders by shared net vote and arrival time", () => {
    const ranked = rankQuestions(
      questions,
      new Map([
        ["popular-open:browser-a", 1],
        ["popular-open:browser-b", 1],
        ["older-open:browser-c", -1],
        ["covered:browser-d", 1],
      ]),
    );

    expect(ranked.map(({ q }) => q.id)).toEqual(["popular-open", "older-open", "covered"]);
    expect(ranked.map(({ net }) => net)).toEqual([2, -1, 1]);
  });

  it("ignores malformed vote keys instead of letting them affect a question", () => {
    const ranked = rankQuestions(questions, new Map([["not-a-question-key", 1]]));

    expect(ranked.map(({ q }) => q.id)).toEqual(["older-open", "popular-open", "covered"]);
    expect(ranked.every(({ net }) => net === 0)).toBe(true);
  });
});
