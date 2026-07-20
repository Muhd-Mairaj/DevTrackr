import { expect, test } from "@playwright/test";

test.describe("Frontend E2E Smoke Test", () => {
  test("loads / and asserts known element is present", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "DevTrackr" }),
    ).toBeVisible();
  });
});
