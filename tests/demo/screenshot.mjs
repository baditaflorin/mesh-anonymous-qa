export default async function prepareScreenshot(page) {
  await page.getByRole("button", { name: "Open this question room" }).click();
  await page.getByLabel("Your question").fill("What would help this group make a clear decision?");
  await page.getByRole("button", { name: "Submit question" }).click();
  await page.locator(".qa-item").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
}
