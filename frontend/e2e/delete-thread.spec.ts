import { expect, test } from "@playwright/test";
import { ensureBackendReachable } from "./helpers/backendHealth";

const userEmail = process.env.E2E_USER_EMAIL || "user@example.com";
const userPassword = process.env.E2E_USER_PASSWORD || "User@123456";

test.beforeAll(async () => {
  await ensureBackendReachable();
});

test("user can delete a thread created by the test", async ({ page }) => {
  const timestamp = Date.now();
  const title = `E2E Delete Thread ${timestamp}`;
  const content = `E2E delete thread content ${timestamp}`;

  await page.goto("/");

  await page.getByTestId("login-button").first().click();
  await expect(page.getByTestId("login-modal")).toBeVisible();
  await page.getByTestId("login-email").fill(userEmail);
  await page.getByTestId("login-password").fill(userPassword);
  await page.getByTestId("login-submit").click();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

  await page.goto("/threads/new");
  await expect(page.getByTestId("thread-category-select")).toBeEnabled();
  await page.getByTestId("thread-category-select").selectOption({ index: 0 });
  await page.getByTestId("thread-title-input").fill(title);
  await page.getByTestId("thread-content-input").fill(content);
  await page.getByTestId("thread-submit").click();

  await expect(page).toHaveURL(/\/threads\/[^/]+$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.once("dialog", (dialog) => dialog.accept());
  await page.getByTestId("thread-delete-button").click();

  await expect(page).toHaveURL(/\/threads$/);
  await expect(page.getByText(title)).toBeHidden();
});
