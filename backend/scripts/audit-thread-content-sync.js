const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const DEFAULT_PREVIEW_LENGTH = 80;
const DEFAULT_LOG_LIMIT = 20;

function parseArgs(argv) {
  const options = {
    apply: false,
    dryRun: true,
    limit: undefined,
    verbose: false,
  };

  argv.forEach((arg) => {
    if (arg === "--apply") {
      options.apply = true;
      options.dryRun = false;
      return;
    }

    if (arg === "--dry-run") {
      options.apply = false;
      options.dryRun = true;
      return;
    }

    if (arg === "--verbose") {
      options.verbose = true;
      return;
    }

    if (arg.startsWith("--limit=")) {
      const value = Number.parseInt(arg.replace("--limit=", ""), 10);

      if (Number.isNaN(value) || value < 1) {
        throw new Error("--limit must be a positive integer.");
      }

      options.limit = value;
      return;
    }

    throw new Error(`Unknown argument: ${arg}`);
  });

  return options;
}

function getPreview(value) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();

  if (normalized.length <= DEFAULT_PREVIEW_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, DEFAULT_PREVIEW_LENGTH)}...`;
}

function getContentLength(value) {
  return typeof value === "string" ? value.length : 0;
}

function buildReportItem(thread, firstPost) {
  return {
    threadId: thread.id,
    title: thread.title,
    threadCreatedAt: thread.createdAt,
    firstPostId: firstPost?.id || null,
    firstPostCreatedAt: firstPost?.createdAt || null,
    threadContentLength: getContentLength(thread.content),
    firstPostContentLength: getContentLength(firstPost?.content),
    threadPreview: getPreview(thread.content),
    firstPostPreview: getPreview(firstPost?.content),
  };
}

async function loadThreads(limit) {
  return prisma.thread.findMany({
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      posts: {
        where: {
          parentId: null,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    ...(limit ? { take: limit } : {}),
  });
}

function auditThreads(threads) {
  const result = {
    synced: [],
    mismatched: [],
    missingFirstPost: [],
    emptyThreadContent: [],
  };

  threads.forEach((thread) => {
    const firstPost = thread.posts[0];
    const reportItem = buildReportItem(thread, firstPost);
    const hasThreadContent = Boolean(thread.content && thread.content.trim());

    if (!firstPost) {
      result.missingFirstPost.push(reportItem);
      return;
    }

    if (!hasThreadContent) {
      result.emptyThreadContent.push(reportItem);
      return;
    }

    if (thread.content === firstPost.content) {
      result.synced.push(reportItem);
      return;
    }

    result.mismatched.push({
      ...reportItem,
      threadContent: thread.content,
      firstPostContent: firstPost.content,
    });
  });

  return result;
}

function printItems(label, items, verbose) {
  if (items.length === 0) {
    return;
  }

  console.log("");
  console.log(`${label} (showing ${Math.min(items.length, DEFAULT_LOG_LIMIT)} of ${items.length})`);

  items.slice(0, DEFAULT_LOG_LIMIT).forEach((item) => {
    console.log(
      `- thread=${item.threadId} firstPost=${item.firstPostId || "missing"} ` +
        `threadCreatedAt=${item.threadCreatedAt.toISOString()} ` +
        `title="${item.title}" threadLen=${item.threadContentLength} ` +
        `firstPostLen=${item.firstPostContentLength}`
    );

    if (verbose) {
      console.log(`  threadPreview="${item.threadPreview}"`);
      console.log(`  firstPostPreview="${item.firstPostPreview}"`);
    }
  });
}

function printSummary(mode, total, auditResult) {
  console.log(`Mode: ${mode}`);
  console.log(`Total threads checked: ${total}`);
  console.log(`Synced: ${auditResult.synced.length}`);
  console.log(`Mismatched: ${auditResult.mismatched.length}`);
  console.log(`Missing first post: ${auditResult.missingFirstPost.length}`);
  console.log(`Skipped empty thread content: ${auditResult.emptyThreadContent.length}`);
}

async function applyBackfill(mismatched) {
  const updates = mismatched.map((item) =>
    prisma.post.update({
      where: {
        id: item.firstPostId,
      },
      data: {
        content: item.threadContent,
      },
    })
  );

  if (updates.length === 0) {
    return 0;
  }

  await prisma.$transaction(updates);
  return updates.length;
}

async function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const threads = await loadThreads(options.limit);
  const auditResult = auditThreads(threads);
  const mode = options.apply ? "apply" : "dry-run";

  printSummary(mode, threads.length, auditResult);
  printItems("Mismatched threads", auditResult.mismatched, options.verbose);
  printItems("Missing first post", auditResult.missingFirstPost, options.verbose);
  printItems("Skipped empty thread content", auditResult.emptyThreadContent, options.verbose);

  if (!options.apply) {
    console.log("");
    console.log("Dry-run only. No database rows were updated.");
    return auditResult;
  }

  const updated = await applyBackfill(auditResult.mismatched);
  console.log("");
  console.log(`Backfill applied. First posts updated: ${updated}`);

  const updatedThreads = await loadThreads(options.limit);
  const updatedAuditResult = auditThreads(updatedThreads);
  console.log("");
  console.log("Post-apply audit:");
  printSummary("post-apply", updatedThreads.length, updatedAuditResult);

  return updatedAuditResult;
}

if (require.main === module) {
  run()
    .catch((error) => {
      console.error("Thread content audit/backfill failed.");
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = {
  auditThreads,
  parseArgs,
  run,
};
