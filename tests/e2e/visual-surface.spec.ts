import { expect, test } from "@playwright/test";

async function assertInsideViewport(
  locator: import("@playwright/test").Locator,
  height: number,
): Promise<void> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, "visible control needs a layout box").not.toBeNull();
  expect((box?.y ?? height) + (box?.height ?? 0)).toBeLessThanOrEqual(height + 1);
}

test("mobile first view keeps the real room and submit actions above the fold", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");

  await expect(page.getByRole("heading", { name: "Let the room ask." })).toBeVisible();
  await assertInsideViewport(page.getByRole("button", { name: "Open this question room" }), 844);

  await page.getByRole("button", { name: "Open this question room" }).click();
  await expect(page.getByRole("heading", { name: "Ask the room" })).toBeVisible();
  await assertInsideViewport(page.getByRole("button", { name: "Submit question" }), 844);
});

test("short desktop view keeps the composer and shared queue intentionally composed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1141, height: 602 });
  await page.goto("./");

  await assertInsideViewport(page.getByRole("button", { name: "Open this question room" }), 602);
  await page.getByRole("button", { name: "Open this question room" }).click();

  const composer = page.locator(".qa-composer-panel");
  const queue = page.locator(".qa-queue-panel");
  await expect(composer).toBeVisible();
  await expect(queue).toBeVisible();
  const [composerBox, queueBox] = await Promise.all([composer.boundingBox(), queue.boundingBox()]);
  expect(composerBox).not.toBeNull();
  expect(queueBox).not.toBeNull();
  expect((composerBox?.x ?? 0) + (composerBox?.width ?? 0)).toBeLessThan(queueBox?.x ?? 0);
  await assertInsideViewport(page.getByRole("button", { name: "Submit question" }), 602);
});
