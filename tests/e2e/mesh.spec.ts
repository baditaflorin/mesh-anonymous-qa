import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

/**
 * Generic shared-room test — works for any mesh-* app without modification.
 * Opens two pages in the same browser context so y-webrtc's BroadcastChannel
 * fallback syncs them with no signaling server / no network.
 *
 * The app intentionally does not make a numeric participant claim from an
 * awareness map: BroadcastChannel and transport timing do not constitute a
 * reliable roster. This asserts that the honest shared-room label survives a
 * real two-peer room instead.
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
    for (const page of [a, b]) {
      await expect(page.locator("[data-qa-room-scope='shared-room']")).toHaveText("Shared room");
      await expect(page.locator("[data-qa-awareness-count]")).toHaveCount(0);
      await expect(page.getByText(/\\d+ live connections?/i)).toHaveCount(0);
    }
  } finally {
    await cleanup();
  }
});
