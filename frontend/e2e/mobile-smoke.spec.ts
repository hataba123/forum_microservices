import { expect, test } from "@playwright/test";
import { ensureBackendReachable } from "./helpers/backendHealth";

test.beforeAll(async () => {
  await ensureBackendReachable();
});

test("mobile can open threads and render a thread detail", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Loading forum data|Top/).first()).toBeVisible();

  await page.goto("/threads");
  await expect(page.getByRole("heading", { name: "Threads" })).toBeVisible();

  const firstThreadLink = page.getByTestId("thread-detail-link").first();
  await expect(firstThreadLink).toBeVisible();

  const title = (await firstThreadLink.textContent())?.trim();
  expect(title).toBeTruthy();

  await firstThreadLink.click();
  await expect(page).toHaveURL(/\/threads\/[^/]+$/);
  await expect(page.getByRole("heading", { name: title || "" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Posts" })).toBeVisible();
});
