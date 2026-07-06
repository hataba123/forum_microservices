import { useEffect, useMemo, useState } from "react";
import ForumBlock, { type ForumRow } from "../components/ForumBlock";
import { getApiErrorMessage } from "../services/apiClient";
import { categoryService } from "../services/categoryService";
import { threadService } from "../services/threadService";
import type { Category, Thread } from "../types/forum";

interface ForumSection {
  category: string;
  forums: ForumRow[];
}

function formatThreadDate(value?: string) {
  if (!value) {
    return "No posts yet";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getThreadAuthor(thread: Thread) {
  return thread.author?.username || thread.author?.email || "Unknown";
}

function mapThreadToForumRow(thread: Thread): ForumRow {
  return {
    title: thread.title,
    threads: 1,
    posts: thread._count?.posts ?? 0,
    lastPost: `${getThreadAuthor(thread)} - ${formatThreadDate(thread.updatedAt)}`,
    href: `/threads/${thread.id}`,
  };
}

function buildForumSections(categories: Category[], threads: Thread[]): ForumSection[] {
  const threadsByCategory = new Map<string, Thread[]>();

  threads.forEach((thread) => {
    const key = thread.category?.id || thread.categoryId;
    const existing = threadsByCategory.get(key) || [];
    existing.push(thread);
    threadsByCategory.set(key, existing);
  });

  const categorySections = categories.map((category) => ({
    category: category.name,
    forums: (threadsByCategory.get(category.id) || []).map(mapThreadToForumRow),
  }));

  const knownCategoryIds = new Set(categories.map((category) => category.id));
  const uncategorizedThreads = threads.filter(
    (thread) => !knownCategoryIds.has(thread.category?.id || thread.categoryId)
  );

  if (uncategorizedThreads.length > 0) {
    categorySections.push({
      category: "Other Threads",
      forums: uncategorizedThreads.map(mapThreadToForumRow),
    });
  }

  return categorySections;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadForumData() {
      setIsLoading(true);
      setError("");

      try {
        const [categoryData, threadResponse] = await Promise.all([
          categoryService.getCategories(),
          threadService.getThreads({ page: 1, limit: 20 }),
        ]);

        if (isMounted) {
          setCategories(categoryData);
          setThreads(threadResponse.data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getApiErrorMessage(loadError, "Could not load forum data."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadForumData();

    return () => {
      isMounted = false;
    };
  }, []);

  const forumSections = useMemo(
    () => buildForumSections(categories, threads),
    [categories, threads]
  );
  const topThreads = threads.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 rounded-xs md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-6">
          {isLoading ? (
            <div className="bg-gray-100 p-4 rounded-xs shadow text-gray-600">
              Loading forum data...
            </div>
          ) : null}

          {error ? (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xs text-red-700">
              {error}
            </div>
          ) : null}

          {!isLoading && !error && forumSections.length === 0 ? (
            <div className="bg-gray-100 p-4 rounded-xs shadow text-gray-600">
              No categories or threads found.
            </div>
          ) : null}

          {!isLoading && !error
            ? forumSections.map((section) => (
                <ForumBlock
                  key={section.category}
                  category={section.category}
                  forums={section.forums}
                />
              ))
            : null}
        </div>

        <aside className="md:col-span-1 space-y-4">
          <div className="bg-gray-100 p-4 rounded-xs shadow">
            <h3 className="font-bold mb-2 text-blue-600">Thông tin</h3>
            <p className="text-sm text-gray-600">
              Chào mừng bạn đến với forum clone VOZ.
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-xl shadow">
            <h3 className="font-bold mb-2 text-blue-600">Top Chủ đề</h3>
            {topThreads.length > 0 ? (
              <ul className="text-sm list-disc list-inside text-gray-700 space-y-1">
                {topThreads.map((thread) => (
                  <li key={thread.id}>{thread.title}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">No threads yet.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
