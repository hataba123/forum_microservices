import { expect, test } from "@playwright/test";
import { ensureBackendReachable } from "./helpers/backendHealth";

const userEmail = process.env.E2E_USER_EMAIL || "user@example.com";
const userPassword = process.env.E2E_USER_PASSWORD || "User@123456";

test.beforeAll(async () => {
  await ensureBackendReachable();
});

test("user can create a thread, reply, nested reply, and vote", async ({
  page,
}) => {
  const timestamp = Date.now();
  const title = `E2E Thread ${timestamp}`;
  const firstPost = `E2E first post ${timestamp}`;
  const editedThreadContent = `E2E edited thread content ${timestamp}`;
  const mainReply = `E2E main reply ${timestamp}`;
  const editedMainReply = `E2E edited main reply ${timestamp}`;
  const nestedReply = `E2E nested reply ${timestamp}`;

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
  await page.getByTestId("thread-content-input").fill(firstPost);
  await page.getByTestId("thread-submit").click();

  await expect(page).toHaveURL(/\/threads\/[^/]+$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText(firstPost).first()).toBeVisible();

  await page.getByTestId("thread-edit-button").click();
  await page.getByTestId("thread-edit-content-input").fill(editedThreadContent);
  await page.getByTestId("thread-edit-submit").click();
  await expect(page.getByText(editedThreadContent)).toHaveCount(2);

  await page.getByTestId("main-reply-input").fill(mainReply);
  await page.getByTestId("main-reply-submit").click();
  const mainReplyCard = page
    .getByTestId("post-card")
    .filter({ hasText: mainReply })
    .first();
  await expect(mainReplyCard).toBeVisible();

  await mainReplyCard.getByTestId("post-edit-button").click();
  await page.getByTestId("post-edit-input").fill(editedMainReply);
  await page.getByTestId("post-edit-submit").click();
  const editedMainReplyCard = page
    .getByTestId("post-card")
    .filter({ hasText: editedMainReply })
    .first();
  await expect(editedMainReplyCard).toBeVisible();

  await editedMainReplyCard.getByTestId("post-reply-button").click();
  await editedMainReplyCard.getByTestId("nested-reply-input").fill(nestedReply);
  await editedMainReplyCard.getByTestId("nested-reply-submit").click();
  await expect(page.getByText(nestedReply)).toBeVisible();

  const mainReplyId = await editedMainReplyCard.getAttribute("data-post-id");
  expect(mainReplyId).toBeTruthy();
  const nestedReplyCard = page
    .locator(`[data-testid="post-card"][data-post-parent-id="${mainReplyId}"]`)
    .filter({ hasText: nestedReply })
    .first();
  await expect(nestedReplyCard).toBeVisible();
  await page.once("dialog", (dialog) => dialog.accept());
  await nestedReplyCard.getByTestId("post-delete-button").click();
  await expect(page.getByText(nestedReply)).toBeHidden();

  await page.getByTestId("thread-upvote").click();
  await expect(page.getByTestId("thread-current-vote")).toHaveText(
    /Your vote 1/
  );

  await editedMainReplyCard.getByTestId("post-upvote").first().click();
  await expect(
    editedMainReplyCard.getByTestId("post-current-vote").first()
  ).toHaveText(/Your vote 1/);
});
