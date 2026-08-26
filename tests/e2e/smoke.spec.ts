import { expect, test } from "@playwright/test";
import { captureConsoleErrors } from "@baditaflorin/mesh-common/testing";

test("Open Floor loads as a polished shared-room entry without page errors", async ({ page }) => {
  const consoleErrors = captureConsoleErrors(page);
  await page.goto("./");

  await expect(page.getByText("Open Floor", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Let the room ask." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open this question room" })).toBeVisible();

  await page.waitForTimeout(700);
  const errors = consoleErrors.getErrors().filter((error) => {
    // The test host intentionally has no public signaling/TURN endpoint. The
    // room must still work through y-webrtc's same-context fallback.
    return !/turn|stun|signaling|websocket|webrtc|failed to load resource|err_failed|err_connection|err_blocked|err_name_not_resolved/i.test(
      error,
    );
  });
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("settings remains discoverable and exposes the truthful local-role controls", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Open settings" }).click();

  const settings = page.getByRole("dialog", { name: "Settings" });
  await expect(settings).toBeVisible();
  await expect(settings.getByText("This browser’s role")).toBeVisible();
  await expect(settings.getByText(/does not grant administrative access/i)).toBeVisible();
  await expect(settings.getByText("Shared queue actions")).toBeVisible();
  await expect(settings.getByText(/Self-hosted infra/i)).toBeVisible();
  await expect(settings.getByRole("link", { name: "source" })).toBeVisible();
});
