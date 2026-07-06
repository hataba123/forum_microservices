const DEFAULT_API_BASE_URL = "http://localhost:3001/api";
const API_BASE_URL = (process.env.API_BASE_URL || DEFAULT_API_BASE_URL).replace(
  /\/+$/,
  ""
);
const SMOKE_USER_EMAIL = process.env.SMOKE_USER_EMAIL || "user@example.com";
const SMOKE_USER_PASSWORD = process.env.SMOKE_USER_PASSWORD || "User@123456";

const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
const threadTitle = `Smoke Test Thread ${timestamp}`;
const firstPostContent = `First post from smoke test ${timestamp}`;
const mainReplyContent = `Smoke main reply ${timestamp}`;
const nestedReplyContent = `Smoke nested reply ${timestamp}`;

let accessToken = "";
let categoryId = "";
let threadId = "";
let mainReplyId = "";
let nestedReplyId = "";

class SmokeTestError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "SmokeTestError";
    this.details = details;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new SmokeTestError(message);
  }
}

function getItems(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null
        ? payload.message || payload.error || JSON.stringify(payload)
        : payload;

    throw new SmokeTestError(`HTTP ${response.status}: ${message}`, {
      status: response.status,
      path,
      payload,
    });
  }

  return payload;
}

async function step(name, action) {
  try {
    const detail = await action();
    console.log(`[PASS] ${name}${detail ? ` - ${detail}` : ""}`);
  } catch (error) {
    console.error(`[FAIL] ${name}`);

    if (error instanceof SmokeTestError) {
      console.error(error.message);
      if (error.details) {
        console.error(JSON.stringify(error.details, null, 2));
      }
    } else {
      console.error(error?.message || error);
    }

    process.exitCode = 1;
    throw error;
  }
}

async function main() {
  console.log(`Forum smoke test API_BASE_URL=${API_BASE_URL}`);
  console.log(`Smoke user=${SMOKE_USER_EMAIL}`);

  await step("login user", async () => {
    const login = await request("/auth/login", {
      method: "POST",
      body: {
        email: SMOKE_USER_EMAIL,
        password: SMOKE_USER_PASSWORD,
      },
    });

    assert(login.accessToken, "Login response is missing accessToken.");
    assert(login.user?.email === SMOKE_USER_EMAIL, "Login user email mismatch.");
    accessToken = login.accessToken;

    return login.user.email;
  });

  await step("load categories", async () => {
    const categories = getItems(await request("/categories"));
    assert(categories.length > 0, "No categories returned.");
    assert(categories[0].id, "First category is missing id.");
    categoryId = categories[0].id;

    return `${categories.length} categories`;
  });

  await step("create thread with first post", async () => {
    const thread = await request("/threads", {
      method: "POST",
      body: {
        categoryId,
        title: threadTitle,
        content: firstPostContent,
      },
    });

    assert(thread.id, "Create thread response is missing id.");
    assert(thread.title === threadTitle, "Created thread title mismatch.");
    threadId = thread.id;

    return threadId;
  });

  await step("get thread detail", async () => {
    const thread = await request(`/threads/${threadId}`);
    assert(thread.id === threadId, "Thread detail id mismatch.");
    assert(thread.title === threadTitle, "Thread detail title mismatch.");

    return thread.title;
  });

  await step("get posts and verify first post", async () => {
    const posts = getItems(
      await request(
        `/posts?threadId=${encodeURIComponent(
          threadId
        )}&page=1&limit=100&sort=oldest`
      )
    );
    const firstPost = posts.find((post) => post.content === firstPostContent);

    assert(firstPost, "First post from created thread was not found.");

    return `${posts.length} posts`;
  });

  await step("create main reply", async () => {
    const reply = await request("/posts", {
      method: "POST",
      body: {
        threadId,
        content: mainReplyContent,
      },
    });

    assert(reply.id, "Main reply response is missing id.");
    assert(reply.content === mainReplyContent, "Main reply content mismatch.");
    mainReplyId = reply.id;

    return mainReplyId;
  });

  await step("create nested reply", async () => {
    const reply = await request("/posts", {
      method: "POST",
      body: {
        threadId,
        parentId: mainReplyId,
        content: nestedReplyContent,
      },
    });

    assert(reply.id, "Nested reply response is missing id.");
    assert(reply.parentId === mainReplyId, "Nested reply parentId mismatch.");
    assert(reply.content === nestedReplyContent, "Nested reply content mismatch.");
    nestedReplyId = reply.id;

    return nestedReplyId;
  });

  await step("vote thread", async () => {
    const vote = await request("/votes", {
      method: "POST",
      body: {
        type: "THREAD",
        threadId,
        value: 1,
      },
    });

    assert(vote.targetId === threadId, "Thread vote target mismatch.");
    assert(vote.value === 1, "Thread vote value mismatch.");

    return `score ${vote.score}`;
  });

  await step("vote main reply post", async () => {
    const vote = await request("/votes", {
      method: "POST",
      body: {
        type: "POST",
        postId: mainReplyId,
        value: 1,
      },
    });

    assert(vote.targetId === mainReplyId, "Post vote target mismatch.");
    assert(vote.value === 1, "Post vote value mismatch.");

    return `score ${vote.score}`;
  });

  await step("read back vote state", async () => {
    const thread = await request(`/threads/${threadId}`);
    const posts = getItems(
      await request(
        `/posts?threadId=${encodeURIComponent(
          threadId
        )}&page=1&limit=100&sort=oldest`
      )
    );
    const mainReply = posts.find((post) => post.id === mainReplyId);
    const nestedReply = posts.find((post) => post.id === nestedReplyId);

    assert(mainReply, "Main reply was not found on read back.");
    assert(nestedReply, "Nested reply was not found on read back.");

    if (thread.currentUserVote !== undefined) {
      assert(thread.currentUserVote === 1, "Thread currentUserVote mismatch.");
    }

    if (mainReply.currentUserVote !== undefined) {
      assert(mainReply.currentUserVote === 1, "Post currentUserVote mismatch.");
    }

    return `thread ${threadId}, main reply ${mainReplyId}, nested reply ${nestedReplyId}`;
  });

  console.log("Forum smoke test completed successfully.");
}

main().catch(() => {
  process.exit(process.exitCode || 1);
});
