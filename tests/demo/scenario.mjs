export default async function recordOpenFloor(a, b) {
  await Promise.all([
    a.getByRole("button", { name: "Open this question room" }).click(),
    b.getByRole("button", { name: "Open this question room" }).click(),
  ]);

  const question = "What would make the next session more useful?";
  await a.getByLabel("Your question").fill(question);
  await a.getByRole("button", { name: "Submit question" }).click();

  const bQuestion = b.locator(".qa-item", { hasText: question });
  await bQuestion.waitFor({ state: "visible", timeout: 10_000 });
  await bQuestion.getByRole("button", { name: /upvote question/i }).click();
  await a.locator(".qa-item", { hasText: question }).waitFor({ state: "visible" });

  // Keep one peer on the input surface and bring the other to the shared
  // result so the recording demonstrates both sides of the real workflow.
  await b.locator(".qa-queue-panel").scrollIntoViewIfNeeded();
  await b.waitForTimeout(7_500);
}
