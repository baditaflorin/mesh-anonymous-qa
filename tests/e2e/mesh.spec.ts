import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

/**
 * Generic mesh-presence test — works for any mesh-* app without modification.
 * Opens two pages in the same browser context so y-webrtc's BroadcastChannel
 * fallback syncs them with no signaling server / no network.
 *
 * Apps that show a peer count in the UI should pass this. Apps that don't
 * surface peer count can override or skip this test.
 */
test("two peers in the same room can both open the real shared workspace", async ({
  browser,
  baseURL,
}) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    await expect(a.getByRole("heading", { name: "Let the room ask." })).toBeVisible();
    await expect(b.getByRole("heading", { name: "Let the room ask." })).toBeVisible();
    await Promise.all([
      a.getByRole("button", { name: "Open this question room" }).click(),
      b.getByRole("button", { name: "Open this question room" }).click(),
    ]);
    await expect(a.getByRole("heading", { name: "Room queue" })).toBeVisible();
    await expect(b.getByRole("heading", { name: "Room queue" })).toBeVisible();
    await expect(a.locator("[data-qa-awareness-count]")).toBeVisible();
    await expect(b.locator("[data-qa-awareness-count]")).toBeVisible();
  } finally {
    await cleanup();
  }
});
