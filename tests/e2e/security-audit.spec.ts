import { appendFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

function audit(entry: Record<string, unknown>): void {
  const output = process.env["MESH_AUDIT_FILE"];
  if (!output) return;
  appendFileSync(output, `${JSON.stringify({ ...entry, ts: Date.now(), result: "pass" })}\n`);
}

test("question text remains literal and the shared-room visibility boundary stays visible", async ({
  page,
}) => {
  let dialogs = 0;
  page.on("dialog", async (dialog) => {
    dialogs += 1;
    await dialog.dismiss();
  });

  await page.goto("./");
  const boundary = page.locator("[data-qa-visibility='shared-room']");
  await expect(boundary).toContainText("Questions are stored without an author label.");
  await expect(boundary).toContainText("Everyone who joins this room can read them.");

  await page.getByRole("button", { name: "Open this question room" }).click();
  const payload = '<img src=x onerror="window.__meshInjected=true">';
  await page.getByLabel("Your question").fill(payload);
  await page.getByRole("button", { name: "Submit question" }).click();

  const item = page.locator(".qa-item", { hasText: payload });
  await expect(item).toBeVisible();
  await expect(item.locator("img")).toHaveCount(0);
  await expect(page.locator(".qa-text", { hasText: payload })).toHaveText(payload);
  expect(
    await page.evaluate(() =>
      Boolean((window as Window & { __meshInjected?: boolean }).__meshInjected),
    ),
  ).toBe(false);
  expect(dialogs).toBe(0);

  audit({
    id: "UI.QA.literalQuestionAndVisibilityBoundary",
    claim:
      "Question text renders as literal text, and the app discloses that room participants can read unlabeled questions.",
    method:
      "Submitted an image/onerror payload through the actual shared Yjs question flow; asserted no image node, no executed payload, no dialog, and visible boundary copy.",
    evidence: {
      renderedLiteral: true,
      injectedImageCount: 0,
      payloadExecuted: false,
      dialogs: 0,
      boundaryCopyVisible: true,
    },
  });
});
