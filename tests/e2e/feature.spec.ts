import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

/**
 * Load-bearing cross-peer test for the ADVERTISED core action:
 * "Submit anonymously, upvote others, presenter answers from the top."
 *
 * Drives the real advertised flow on peer A (audience submits a question +
 * upvotes it) and asserts the result propagates to peer B (presenter) over the
 * Yjs doc — then peer B (presenter) marks it answered and peer A sees the
 * struck-through "answered" state. This fails on any code where writes go to
 * React state instead of the shared Y.Array/Y.Map, or where peers read/write
 * different keys.
 */
test("submitted question + upvote + mark-answered propagate peer→peer", async ({
  browser,
  baseURL,
}) => {
  // Peer A defaults to audience; make peer B the presenter so the full
  // submit → see → vote → answer round-trip crosses the mesh.
  const roomId = `e2e-${Math.random().toString(36).slice(2, 8)}`;
  const { a, b, cleanup, context } = await openTwoPeers(browser, baseURL ?? "", {
    storagePrefix,
    roomId,
  });
  try {
    // Set B to presenter mode and reload so the radio takes effect.
    await context.addInitScript(
      ({ prefix }) => {
        try {
          localStorage.setItem(`${prefix}:mode`, "presenter");
        } catch {
          /* ignore */
        }
      },
      { prefix: storagePrefix },
    );
    await b.reload();

    // Arm both peers (the "Join room" gate).
    await a.getByRole("button", { name: /join room/i }).click();
    await b.getByRole("button", { name: /join room/i }).click();

    // Peer A (audience) submits an anonymous question.
    const question = `What is the airspeed of a swallow ${roomId}?`;
    await a.getByPlaceholder(/ask anything/i).fill(question);
    await a.getByRole("button", { name: /^submit$/i }).click();

    // Peer B (presenter) sees the submitted question — the heart of the claim.
    await expect(b.getByText(question)).toBeVisible({ timeout: 10000 });

    // Peer A upvotes its own question; the net score must reach peer B.
    const aItem = a.locator(".qa-item", { hasText: question });
    await aItem.getByRole("button", { name: /upvote/i }).click();
    const bItem = b.locator(".qa-item", { hasText: question });
    await expect(bItem.locator(".qa-net")).toHaveText("1", { timeout: 10000 });

    // Peer B (presenter) marks it answered; peer A must see the answered state.
    await bItem.getByRole("button", { name: /mark answered/i }).click();
    await expect(a.locator(".qa-item", { hasText: question })).toHaveClass(/qa-answered/, {
      timeout: 10000,
    });
  } finally {
    await cleanup();
  }
});
