import { expect, test } from "@playwright/test";

test("home page links into launch and discovery surfaces", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /trust-first foundation/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /beta launch/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /explore route shell/i })).toBeVisible();
});

test("auth pages render core controls", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

  await page.goto("/auth/register");
  await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
});

test("mobile fishing journey is reachable without database state", async ({ page }) => {
  await page.goto("/listings/fishing/nearby");

  await expect(page.getByRole("heading", { name: /i found a river/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /use my position|refresh my position/i })).toBeVisible();
});

test("legal pages remain available for launch review", async ({ page }) => {
  await page.goto("/legal/privacy");
  await expect(page.getByRole("heading", { name: /privacy/i })).toBeVisible();

  await page.goto("/legal/terms");
  await expect(page.getByRole("heading", { name: /terms/i })).toBeVisible();
});
