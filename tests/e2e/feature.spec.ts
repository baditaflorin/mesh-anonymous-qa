import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

async function openRoom(page: import("@playwright/test").Page): Promise<void> {
  await page.getByRole("button", { name: "Open this question room" }).click();
  await expect(page.getByRole("heading", { name: "Room queue" })).toBeVisible();
}

/**
 * Load-bearing shared workflow: it drives the actual Y.Array/Y.Map room,
 * rather than a React-only optimistic view. The question crosses from one
 * browser peer to another, its vote crosses back, and the facilitator writes
 * the shared answered state.
 */
test("question, vote, and covered state propagate across two real room peers", async ({
  browser,
  baseURL,
}) => {
  const roomId = `e2e-${Math.random().toString(36).slice(2, 8)}`;
  const { a, b, cleanup, context } = await openTwoPeers(browser, baseURL ?? "", {
    storagePrefix,
    roomId,
  });
  try {
    // The local role is deliberately not authorization. It only changes B's
    // controls, letting this test exercise the real shared covered write.
    await context.addInitScript(
      ({ prefix }: { prefix: string }) => {
        try {
          localStorage.setItem(`${prefix}:mode`, "presenter");
        } catch {
          /* private storage is not part of this test */
        }
      },
      { prefix: storagePrefix },
    );
    await b.reload();

    await Promise.all([openRoom(a), openRoom(b)]);
    await expect(b.getByText("Local role · presenter")).toBeVisible();

    const question = `How should we prioritize the next release? ${roomId}`;
    await a.getByLabel("Your question").fill(question);
    await a.getByRole("button", { name: "Submit question" }).click();

    const aItem = a.locator(".qa-item", { hasText: question });
    const bItem = b.locator(".qa-item", { hasText: question });
    await expect(bItem).toBeVisible({ timeout: 10_000 });
    await expect(bItem.getByText("author label not stored")).toBeVisible();

    await aItem.getByRole("button", { name: /upvote question/i }).click();
    await expect(aItem.locator(".qa-net")).toHaveText("1", { timeout: 10_000 });
    await expect(bItem.locator(".qa-net")).toHaveText("1", { timeout: 10_000 });

    await bItem.getByRole("button", { name: "Mark covered" }).click();
    await expect(a.locator(".qa-item", { hasText: question })).toHaveClass(/qa-answered/, {
      timeout: 10_000,
    });
  } finally {
    await cleanup();
  }
});

test("a browser-local voter can only toggle one vote per question", async ({
  browser,
  baseURL,
}) => {
  const roomId = `e2e-${Math.random().toString(36).slice(2, 8)}`;
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", {
    storagePrefix,
    roomId,
  });
  try {
    await Promise.all([openRoom(a), openRoom(b)]);

    const question = `Vote toggle probe ${roomId}`;
    await a.getByLabel("Your question").fill(question);
    await a.getByRole("button", { name: "Submit question" }).click();

    const aItem = a.locator(".qa-item", { hasText: question });
    const bItem = b.locator(".qa-item", { hasText: question });
    await expect(bItem).toBeVisible({ timeout: 10_000 });

    const upvote = aItem.getByRole("button", { name: /upvote question/i });
    await upvote.click();
    await expect(aItem.locator(".qa-net")).toHaveText("1", { timeout: 10_000 });
    await expect(bItem.locator(".qa-net")).toHaveText("1", { timeout: 10_000 });

    await upvote.click();
    await expect(aItem.locator(".qa-net")).toHaveText("0", { timeout: 10_000 });
    await expect(bItem.locator(".qa-net")).toHaveText("0", { timeout: 10_000 });
  } finally {
    await cleanup();
  }
});

test("the room explains its visibility boundary and supports keyboard submission", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("[data-qa-visibility='shared-room']")).toContainText(
    "Questions are stored without an author label.",
  );
  await expect(page.locator("[data-qa-visibility='shared-room']")).toContainText(
    "Everyone who joins this room can read them.",
  );

  await openRoom(page);
  const question = "Can keyboard users submit a question?";
  await page.getByLabel("Your question").fill(question);
  await page.getByRole("button", { name: "Submit question" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".qa-item", { hasText: question })).toBeVisible();
});
