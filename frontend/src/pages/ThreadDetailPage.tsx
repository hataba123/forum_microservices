import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../services/apiClient";
import { postService } from "../services/postService";
import { threadService } from "../services/threadService";
import type { Post, ThreadDetail } from "../types/forum";

interface PostNode extends Post {
  replies: PostNode[];
}

function formatDate(value?: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getAuthorLabel(author?: { username?: string; email?: string }) {
  return author?.username || author?.email || "Unknown";
}

function getVoteScore(item: Pick<Post, "voteScore" | "voteStats"> | ThreadDetail) {
  return item.voteScore ?? item.voteStats?.score ?? 0;
}

function buildPostTree(posts: Post[]) {
  const nodeMap = new Map<string, PostNode>();
  const roots: PostNode[] = [];

  posts.forEach((post) => {
    nodeMap.set(post.id, { ...post, replies: [] });
  });

  nodeMap.forEach((node) => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)?.replies.push(node);
      return;
    }

    roots.push(node);
  });

  return roots;
}

function PostCard({ post, depth = 0 }: { post: PostNode; depth?: number }) {
  const score = getVoteScore(post);

  return (
    <div
      className={`rounded-xs border bg-white p-4 shadow-sm ${
        depth > 0 ? "ml-4 border-l-4 border-l-blue-200" : ""
      }`}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="font-semibold text-blue-800">
            {getAuthorLabel(post.author)}
          </div>
          <div className="text-xs text-gray-500">{formatDate(post.createdAt)}</div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          <span className="rounded-xs bg-gray-100 px-2 py-1">Score {score}</span>
          <span className="rounded-xs bg-gray-100 px-2 py-1">
            Up {post.upvotes ?? post.voteStats?.upvotes ?? 0}
          </span>
          <span className="rounded-xs bg-gray-100 px-2 py-1">
            Down {post.downvotes ?? post.voteStats?.downvotes ?? 0}
          </span>
          <span className="rounded-xs bg-blue-50 px-2 py-1 text-blue-700">
            Your vote {post.currentUserVote ?? 0}
          </span>
        </div>
      </div>

      <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800">
        {post.content}
      </div>

      {post.replies.length > 0 ? (
        <div className="mt-4 space-y-3">
          {post.replies.map((reply) => (
            <PostCard key={reply.id} post={reply} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadThreadDetail(threadId: string) {
      setIsLoading(true);
      setError("");

      try {
        const [threadData, postsResponse] = await Promise.all([
          threadService.getThreadById(threadId),
          postService.getPosts({
            threadId,
            page: 1,
            limit: 100,
            sort: "oldest",
          }),
        ]);

        if (isMounted) {
          setThread(threadData);
          setPosts(postsResponse.data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getApiErrorMessage(loadError, "Could not load thread detail."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (!id) {
      setError("Thread id is missing.");
      setIsLoading(false);
      return;
    }

    loadThreadDetail(id);

    return () => {
      isMounted = false;
    };
  }, [id]);

  const postTree = useMemo(() => buildPostTree(posts), [posts]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-xs bg-gray-100 p-4 text-gray-600 shadow">
          Loading thread detail...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-xs border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-xs bg-gray-100 p-4 text-gray-600 shadow">
          Thread not found.
        </div>
      </div>
    );
  }

  const threadScore = getVoteScore(thread);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link to="/threads" className="text-sm text-blue-700 hover:underline">
          Back to threads
        </Link>
      </div>

      <article className="rounded-xs bg-gray-100 shadow">
        <div className="rounded-t-xl bg-white px-4 py-4">
          <div className="text-sm text-gray-600">
            {thread.category?.name || "Uncategorized"}
          </div>
          <h1 className="mt-1 text-2xl font-bold text-blue-800">{thread.title}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
            <span>By {getAuthorLabel(thread.author)}</span>
            <span>{formatDate(thread.createdAt)}</span>
            <span>{thread._count?.posts ?? posts.length} posts</span>
            <span>{thread.viewCount ?? 0} views</span>
            {thread.isLocked ? <span>Locked</span> : null}
            {thread.isPinned ? <span>Pinned</span> : null}
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-xs border bg-white p-4">
            <div className="mb-3 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-xs bg-gray-100 px-2 py-1">
                Score {threadScore}
              </span>
              <span className="rounded-xs bg-gray-100 px-2 py-1">
                Up {thread.upvotes ?? thread.voteStats?.upvotes ?? 0}
              </span>
              <span className="rounded-xs bg-gray-100 px-2 py-1">
                Down {thread.downvotes ?? thread.voteStats?.downvotes ?? 0}
              </span>
              <span className="rounded-xs bg-blue-50 px-2 py-1 text-blue-700">
                Your vote {thread.currentUserVote ?? 0}
              </span>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-6 text-gray-800">
              {thread.content}
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-blue-800">Posts</h2>

            {postTree.length === 0 ? (
              <div className="rounded-xs bg-white p-4 text-gray-600">
                No posts found for this thread.
              </div>
            ) : (
              postTree.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </section>
        </div>
      </article>
    </div>
  );
}
