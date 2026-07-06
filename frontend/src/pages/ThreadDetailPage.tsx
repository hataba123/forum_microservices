import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../services/apiClient";
import { postService } from "../services/postService";
import { threadService } from "../services/threadService";
import { useAuth } from "../stores/useAuth";
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

interface PostCardProps {
  post: PostNode;
  canReply: boolean;
  isAuthenticated: boolean;
  activeReplyPostId: string | null;
  nestedContent: string;
  nestedError: string;
  isSubmittingNested: boolean;
  onOpenReply: (postId: string) => void;
  onCancelReply: () => void;
  onNestedContentChange: (value: string) => void;
  onSubmitNested: (postId: string) => Promise<void>;
  depth?: number;
}

function PostCard({
  post,
  canReply,
  isAuthenticated,
  activeReplyPostId,
  nestedContent,
  nestedError,
  isSubmittingNested,
  onOpenReply,
  onCancelReply,
  onNestedContentChange,
  onSubmitNested,
  depth = 0,
}: PostCardProps) {
  const score = getVoteScore(post);
  const isReplyOpen = activeReplyPostId === post.id;

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

      <div className="mt-3">
        {canReply ? (
          <button
            type="button"
            onClick={() => onOpenReply(post.id)}
            className="text-sm text-blue-700 hover:underline"
          >
            Reply
          </button>
        ) : !isAuthenticated ? (
          <span className="text-sm text-gray-500">Log in to reply.</span>
        ) : null}
      </div>

      {isReplyOpen ? (
        <div className="mt-3 rounded-xs bg-blue-50 p-3">
          <textarea
            value={nestedContent}
            onChange={(event) => onNestedContentChange(event.target.value)}
            className="min-h-24 w-full rounded-xs border p-2 text-sm"
            placeholder="Write a nested reply..."
          />
          {nestedError ? (
            <div className="mt-2 text-sm text-red-600">{nestedError}</div>
          ) : null}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={!nestedContent.trim() || isSubmittingNested}
              onClick={() => void onSubmitNested(post.id)}
              className="rounded-xs bg-blue-700 px-3 py-1 text-sm text-white disabled:opacity-50"
            >
              {isSubmittingNested ? "Submitting..." : "Submit reply"}
            </button>
            <button
              type="button"
              onClick={onCancelReply}
              className="rounded-xs bg-gray-200 px-3 py-1 text-sm text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {post.replies.length > 0 ? (
        <div className="mt-4 space-y-3">
          {post.replies.map((reply) => (
            <PostCard
              key={reply.id}
              post={reply}
              canReply={canReply}
              isAuthenticated={isAuthenticated}
              activeReplyPostId={activeReplyPostId}
              nestedContent={nestedContent}
              nestedError={nestedError}
              isSubmittingNested={isSubmittingNested}
              onOpenReply={onOpenReply}
              onCancelReply={onCancelReply}
              onNestedContentChange={onNestedContentChange}
              onSubmitNested={onSubmitNested}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [mainReplyContent, setMainReplyContent] = useState("");
  const [mainReplyError, setMainReplyError] = useState("");
  const [nestedReplyError, setNestedReplyError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeReplyPostId, setActiveReplyPostId] = useState<string | null>(null);
  const [nestedReplyContent, setNestedReplyContent] = useState("");
  const [submittingTarget, setSubmittingTarget] = useState<string | null>(null);

  const loadThreadDetail = useCallback(async (threadId: string) => {
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

      setThread(threadData);
      setPosts(postsResponse.data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load thread detail."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reloadPosts = useCallback(async () => {
    if (!id) {
      return;
    }

    const [threadData, postsResponse] = await Promise.all([
      threadService.getThreadById(id),
      postService.getPosts({
        threadId: id,
        page: 1,
        limit: 100,
        sort: "oldest",
      }),
    ]);

    setThread(threadData);
    setPosts(postsResponse.data);
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    if (!id) {
      setError("Thread id is missing.");
      setIsLoading(false);
      return;
    }

    loadThreadDetail(id).catch(() => {
      if (isMounted) {
        setError("Could not load thread detail.");
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [id, loadThreadDetail]);

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
  const canReply = isAuthenticated && !thread.isLocked;
  const isSubmittingMain = submittingTarget === "main";
  const isSubmittingNested =
    submittingTarget !== null && submittingTarget !== "main";

  const handleSubmitMainReply = async () => {
    if (!id || !canReply) {
      return;
    }

    const content = mainReplyContent.trim();
    if (!content) {
      setMainReplyError("Reply content is required.");
      return;
    }

    setSubmittingTarget("main");
    setMainReplyError("");
    setSuccessMessage("");

    try {
      await postService.createPost({
        threadId: id,
        content,
      });
      setMainReplyContent("");
      await reloadPosts();
      setSuccessMessage("Reply posted.");
    } catch (submitError) {
      setMainReplyError(getApiErrorMessage(submitError, "Could not submit reply."));
    } finally {
      setSubmittingTarget(null);
    }
  };

  const handleOpenNestedReply = (postId: string) => {
    setActiveReplyPostId(postId);
    setNestedReplyContent("");
    setNestedReplyError("");
    setSuccessMessage("");
  };

  const handleCancelNestedReply = () => {
    setActiveReplyPostId(null);
    setNestedReplyContent("");
    setNestedReplyError("");
  };

  const handleSubmitNestedReply = async (parentId: string) => {
    if (!id || !canReply) {
      return;
    }

    const content = nestedReplyContent.trim();
    if (!content) {
      setNestedReplyError("Reply content is required.");
      return;
    }

    setSubmittingTarget(parentId);
    setNestedReplyError("");
    setSuccessMessage("");

    try {
      await postService.createPost({
        threadId: id,
        parentId,
        content,
      });
      setActiveReplyPostId(null);
      setNestedReplyContent("");
      await reloadPosts();
      setSuccessMessage("Nested reply posted.");
    } catch (submitError) {
      setNestedReplyError(
        getApiErrorMessage(submitError, "Could not submit nested reply.")
      );
    } finally {
      setSubmittingTarget(null);
    }
  };

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

            <div className="rounded-xs border bg-white p-4">
              <h3 className="font-semibold text-blue-800">Reply to thread</h3>
              {thread.isLocked ? (
                <p className="mt-2 text-sm text-gray-600">
                  This thread is locked. Replies are disabled.
                </p>
              ) : !isAuthenticated ? (
                <p className="mt-2 text-sm text-gray-600">
                  You need to log in to reply. Use the Log in button in the
                  header or{" "}
                  <Link to="/register" className="text-blue-700 hover:underline">
                    register
                  </Link>
                  .
                </p>
              ) : (
                <>
                  <textarea
                    value={mainReplyContent}
                    onChange={(event) => setMainReplyContent(event.target.value)}
                    className="mt-3 min-h-28 w-full rounded-xs border p-2 text-sm"
                    placeholder="Write your reply..."
                  />
                  {mainReplyError ? (
                    <div className="mt-2 text-sm text-red-600">{mainReplyError}</div>
                  ) : null}
                  <button
                    type="button"
                    disabled={!mainReplyContent.trim() || isSubmittingMain}
                    onClick={() => void handleSubmitMainReply()}
                    className="mt-3 rounded-xs bg-blue-700 px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {isSubmittingMain ? "Submitting..." : "Submit reply"}
                  </button>
                </>
              )}
              {successMessage ? (
                <div className="mt-2 text-sm text-green-700">{successMessage}</div>
              ) : null}
            </div>

            {postTree.length === 0 ? (
              <div className="rounded-xs bg-white p-4 text-gray-600">
                No posts found for this thread.
              </div>
            ) : (
              postTree.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  canReply={canReply}
                  isAuthenticated={isAuthenticated}
                  activeReplyPostId={activeReplyPostId}
                  nestedContent={nestedReplyContent}
                  nestedError={nestedReplyError}
                  isSubmittingNested={isSubmittingNested}
                  onOpenReply={handleOpenNestedReply}
                  onCancelReply={handleCancelNestedReply}
                  onNestedContentChange={setNestedReplyContent}
                  onSubmitNested={handleSubmitNestedReply}
                />
              ))
            )}
          </section>
        </div>
      </article>
    </div>
  );
}
