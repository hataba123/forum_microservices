import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../services/apiClient";
import { threadService } from "../services/threadService";
import type { PaginationMeta, Thread } from "../types/forum";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadThreads() {
      setIsLoading(true);
      setError("");

      try {
        const response = await threadService.getThreads({ page, limit: 20 });

        if (isMounted) {
          setThreads(response.data);
          setPagination(response.pagination);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getApiErrorMessage(loadError, "Could not load threads."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadThreads();

    return () => {
      isMounted = false;
    };
  }, [page]);

  const totalPages = pagination?.totalPages || pagination?.pages || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-gray-100 rounded-xs shadow">
        <div className="flex flex-col gap-3 bg-white px-4 py-3 rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-blue-700">Threads</h1>
          <Link
            to="/threads/new"
            className="rounded-xs bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Create Thread
          </Link>
        </div>

        {isLoading ? (
          <div className="p-4 text-gray-600">Loading threads...</div>
        ) : null}

        {error ? (
          <div className="m-4 bg-red-50 border border-red-200 p-4 rounded-xs text-red-700">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && threads.length === 0 ? (
          <div className="p-4 text-gray-600">No threads found.</div>
        ) : null}

        {!isLoading && !error && threads.length > 0 ? (
          <div className="divide-y">
            {threads.map((thread) => (
              <div key={thread.id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <Link
                      to={`/threads/${thread.id}`}
                      className="font-semibold text-blue-700 hover:underline"
                    >
                      {thread.title}
                    </Link>
                    <div className="mt-1 text-sm text-gray-600">
                      {thread.category?.name || "Uncategorized"} ·{" "}
                      {thread.author?.username || thread.author?.email || "Unknown"} ·{" "}
                      {formatDate(thread.createdAt)}
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm text-gray-600 md:text-right">
                    <span>{thread._count?.posts ?? 0} posts</span>
                    <span>Score {thread.voteScore ?? thread.voteStats?.score ?? 0}</span>
                    <span>Your vote {thread.currentUserVote ?? 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && !error && totalPages > 1 ? (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-xs bg-blue-700 px-3 py-1 text-white disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xs bg-blue-700 px-3 py-1 text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
