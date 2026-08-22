import { expect, test } from "@playwright/test";

test.describe("@smoke", () => {
  test("home page loads with OboxSTEAM branding", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/OboxSTEAM/i);
    await expect(page.getByRole("main")).toBeVisible();
  });
});
