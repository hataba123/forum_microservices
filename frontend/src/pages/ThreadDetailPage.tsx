import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import VoteButtons from "../components/VoteButtons";
import { getApiErrorMessage } from "../services/apiClient";
import { postService } from "../services/postService";
import { threadService } from "../services/threadService";
import { voteService } from "../services/voteService";
import { useAuth } from "../stores/useAuth";
import type { Post, ThreadDetail, VoteValue } from "../types/forum";
import { canManageContent } from "../utils/permissions";

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

function getUpvotes(item: Pick<Post, "upvotes" | "voteStats"> | ThreadDetail) {
  return item.upvotes ?? item.voteStats?.upvotes ?? 0;
}

function getDownvotes(item: Pick<Post, "downvotes" | "voteStats"> | ThreadDetail) {
  return item.downvotes ?? item.voteStats?.downvotes ?? 0;
}

function getCurrentUserVote(
  item: Pick<Post, "currentUserVote"> | ThreadDetail
) {
  return item.currentUserVote ?? 0;
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
  canVote: boolean;
  voteLoadingTarget: string | null;
  onVotePost: (postId: string, value: VoteValue) => Promise<void>;
  canManagePost: (post: PostNode) => boolean;
  activeEditPostId: string | null;
  editPostContent: string;
  postActionTarget: string | null;
  postActionError: string;
  postActionErrorTarget: string | null;
  onEditPost: (post: PostNode) => void;
  onCancelEditPost: () => void;
  onEditPostContentChange: (value: string) => void;
  onSubmitEditPost: (postId: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
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
  canVote,
  voteLoadingTarget,
  onVotePost,
  canManagePost,
  activeEditPostId,
  editPostContent,
  postActionTarget,
  postActionError,
  postActionErrorTarget,
  onEditPost,
  onCancelEditPost,
  onEditPostContentChange,
  onSubmitEditPost,
  onDeletePost,
  depth = 0,
}: PostCardProps) {
  const score = getVoteScore(post);
  const isReplyOpen = activeReplyPostId === post.id;
  const postVoteTarget = `post:${post.id}`;
  const isEditingPost = activeEditPostId === post.id;
  const isPostActionLoading = postActionTarget === post.id;
  const canManage = canManagePost(post);

  return (
    <div
      className={`rounded-xs border bg-white p-4 shadow-sm ${
        depth > 0 ? "ml-4 border-l-4 border-l-blue-200" : ""
      }`}
      data-testid="post-card"
      data-post-id={post.id}
      data-post-parent-id={post.parentId || undefined}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="font-semibold text-blue-800">
            {getAuthorLabel(post.author)}
          </div>
          <div className="text-xs text-gray-500">{formatDate(post.createdAt)}</div>
        </div>

        <VoteButtons
          score={score}
          upvotes={getUpvotes(post)}
          downvotes={getDownvotes(post)}
          currentUserVote={getCurrentUserVote(post)}
          disabled={!canVote}
          isLoading={voteLoadingTarget === postVoteTarget}
          testIdPrefix="post"
          onVote={(value) => void onVotePost(post.id, value)}
        />
      </div>

      <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800">
        {isEditingPost ? (
          <div className="space-y-2">
            <textarea
              value={editPostContent}
              onChange={(event) => onEditPostContentChange(event.target.value)}
              className="min-h-28 w-full rounded-xs border p-2 text-sm"
              data-testid="post-edit-input"
            />
            {postActionError && postActionErrorTarget === post.id ? (
              <div className="text-sm text-red-600">{postActionError}</div>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!editPostContent.trim() || isPostActionLoading}
                onClick={() => void onSubmitEditPost(post.id)}
                className="rounded-xs bg-blue-700 px-3 py-1 text-sm text-white disabled:opacity-50"
                data-testid="post-edit-submit"
              >
                {isPostActionLoading ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={onCancelEditPost}
                className="rounded-xs bg-gray-200 px-3 py-1 text-sm text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          post.content
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        {canReply ? (
          <button
            type="button"
            onClick={() => onOpenReply(post.id)}
            className="text-sm text-blue-700 hover:underline"
            data-testid="post-reply-button"
          >
            Reply
          </button>
        ) : !isAuthenticated ? (
          <span className="text-sm text-gray-500">Log in to reply.</span>
        ) : null}

        {canManage ? (
          <>
            <button
              type="button"
              onClick={() => onEditPost(post)}
              className="text-sm text-blue-700 hover:underline"
              data-testid="post-edit-button"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={isPostActionLoading}
              onClick={() => void onDeletePost(post.id)}
              className="text-sm text-red-700 hover:underline disabled:opacity-50"
              data-testid="post-delete-button"
            >
              {isPostActionLoading ? "Deleting..." : "Delete"}
            </button>
          </>
        ) : null}
      </div>

      {postActionError && !isEditingPost && postActionErrorTarget === post.id ? (
        <div className="mt-2 text-sm text-red-600">{postActionError}</div>
      ) : null}

      {isReplyOpen ? (
        <div className="mt-3 rounded-xs bg-blue-50 p-3">
          <textarea
            value={nestedContent}
            onChange={(event) => onNestedContentChange(event.target.value)}
            className="min-h-24 w-full rounded-xs border p-2 text-sm"
            placeholder="Write a nested reply..."
            data-testid="nested-reply-input"
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
              data-testid="nested-reply-submit"
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
              canVote={canVote}
              voteLoadingTarget={voteLoadingTarget}
              onVotePost={onVotePost}
              canManagePost={canManagePost}
              activeEditPostId={activeEditPostId}
              editPostContent={editPostContent}
              postActionTarget={postActionTarget}
              postActionError={postActionError}
              postActionErrorTarget={postActionErrorTarget}
              onEditPost={onEditPost}
              onCancelEditPost={onCancelEditPost}
              onEditPostContentChange={onEditPostContentChange}
              onSubmitEditPost={onSubmitEditPost}
              onDeletePost={onDeletePost}
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
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [threadTitleInput, setThreadTitleInput] = useState("");
  const [threadContentInput, setThreadContentInput] = useState("");
  const [threadActionError, setThreadActionError] = useState("");
  const [threadActionTarget, setThreadActionTarget] = useState<string | null>(null);
  const [mainReplyContent, setMainReplyContent] = useState("");
  const [mainReplyError, setMainReplyError] = useState("");
  const [nestedReplyError, setNestedReplyError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeReplyPostId, setActiveReplyPostId] = useState<string | null>(null);
  const [nestedReplyContent, setNestedReplyContent] = useState("");
  const [activeEditPostId, setActiveEditPostId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [postActionError, setPostActionError] = useState("");
  const [postActionErrorTarget, setPostActionErrorTarget] = useState<string | null>(null);
  const [postActionTarget, setPostActionTarget] = useState<string | null>(null);
  const [submittingTarget, setSubmittingTarget] = useState<string | null>(null);
  const [voteLoadingTarget, setVoteLoadingTarget] = useState<string | null>(null);
  const [voteError, setVoteError] = useState("");

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

  const canManageThread = canManageContent(user, thread?.authorId);
  const canManagePost = useCallback(
    (post: PostNode) => canManageContent(user, post.authorId),
    [user]
  );

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
  const canVote = isAuthenticated;
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

  const handleVoteThread = async (value: VoteValue) => {
    if (!id || !isAuthenticated) {
      setVoteError("You need to log in to vote.");
      return;
    }

    setVoteLoadingTarget(`thread:${id}`);
    setVoteError("");

    try {
      await voteService.voteThread(id, value);
      await reloadPosts();
    } catch (voteSubmitError) {
      setVoteError(getApiErrorMessage(voteSubmitError, "Could not submit vote."));
    } finally {
      setVoteLoadingTarget(null);
    }
  };

  const handleVotePost = async (postId: string, value: VoteValue) => {
    if (!isAuthenticated) {
      setVoteError("You need to log in to vote.");
      return;
    }

    setVoteLoadingTarget(`post:${postId}`);
    setVoteError("");

    try {
      await voteService.votePost(postId, value);
      await reloadPosts();
    } catch (voteSubmitError) {
      setVoteError(getApiErrorMessage(voteSubmitError, "Could not submit vote."));
    } finally {
      setVoteLoadingTarget(null);
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

  const handleStartEditThread = () => {
    if (!thread || !canManageThread) {
      return;
    }

    setThreadTitleInput(thread.title);
    setThreadContentInput(thread.content);
    setThreadActionError("");
    setIsEditingThread(true);
  };

  const handleCancelEditThread = () => {
    setIsEditingThread(false);
    setThreadActionError("");
    setThreadTitleInput("");
    setThreadContentInput("");
  };

  const handleSubmitEditThread = async () => {
    if (!id || !thread || !canManageThread) {
      return;
    }

    const title = threadTitleInput.trim();
    const content = threadContentInput.trim();

    if (!title) {
      setThreadActionError("Thread title is required.");
      return;
    }

    if (!content) {
      setThreadActionError("Thread content is required.");
      return;
    }

    setThreadActionTarget("update");
    setThreadActionError("");

    try {
      await threadService.updateThread(id, { title, content });
      await loadThreadDetail(id);
      setIsEditingThread(false);
    } catch (updateError) {
      setThreadActionError(
        getApiErrorMessage(updateError, "Could not update thread.")
      );
    } finally {
      setThreadActionTarget(null);
    }
  };

  const handleDeleteThread = async () => {
    if (!id || !thread || !canManageThread) {
      return;
    }

    if (!window.confirm("Delete this thread? This action cannot be undone.")) {
      return;
    }

    setThreadActionTarget("delete");
    setThreadActionError("");

    try {
      await threadService.deleteThread(id);
      navigate("/threads");
    } catch (deleteError) {
      setThreadActionError(
        getApiErrorMessage(deleteError, "Could not delete thread.")
      );
    } finally {
      setThreadActionTarget(null);
    }
  };

  const handleStartEditPost = (post: PostNode) => {
    if (!canManagePost(post)) {
      return;
    }

    setActiveEditPostId(post.id);
    setEditPostContent(post.content);
    setPostActionError("");
    setPostActionErrorTarget(null);
  };

  const handleCancelEditPost = () => {
    setActiveEditPostId(null);
    setEditPostContent("");
    setPostActionError("");
    setPostActionErrorTarget(null);
  };

  const handleSubmitEditPost = async (postId: string) => {
    const content = editPostContent.trim();

    if (!content) {
      setPostActionError("Post content is required.");
      setPostActionErrorTarget(postId);
      return;
    }

    setPostActionTarget(postId);
    setPostActionError("");
    setPostActionErrorTarget(null);

    try {
      await postService.updatePost(postId, { content });
      setActiveEditPostId(null);
      setEditPostContent("");
      await reloadPosts();
    } catch (updateError) {
      setPostActionError(getApiErrorMessage(updateError, "Could not update post."));
      setPostActionErrorTarget(postId);
    } finally {
      setPostActionTarget(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Delete this post? This action cannot be undone.")) {
      return;
    }

    setPostActionTarget(postId);
    setPostActionError("");
    setPostActionErrorTarget(null);

    try {
      await postService.deletePost(postId);
      await reloadPosts();
    } catch (deleteError) {
      setPostActionError(getApiErrorMessage(deleteError, "Could not delete post."));
      setPostActionErrorTarget(postId);
    } finally {
      setPostActionTarget(null);
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
          {canManageThread ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleStartEditThread}
                className="rounded-xs bg-blue-700 px-3 py-1 text-sm text-white"
                data-testid="thread-edit-button"
              >
                Edit Thread
              </button>
              <button
                type="button"
                disabled={threadActionTarget === "delete"}
                onClick={() => void handleDeleteThread()}
                className="rounded-xs bg-red-700 px-3 py-1 text-sm text-white disabled:opacity-50"
                data-testid="thread-delete-button"
              >
                {threadActionTarget === "delete" ? "Deleting..." : "Delete Thread"}
              </button>
            </div>
          ) : null}
          {threadActionError ? (
            <div className="mt-2 text-sm text-red-600">{threadActionError}</div>
          ) : null}
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-xs border bg-white p-4">
            <div className="mb-3 space-y-2">
              <VoteButtons
                score={threadScore}
                upvotes={getUpvotes(thread)}
                downvotes={getDownvotes(thread)}
                currentUserVote={getCurrentUserVote(thread)}
                disabled={!canVote}
                isLoading={voteLoadingTarget === `thread:${thread.id}`}
                testIdPrefix="thread"
                onVote={(value) => void handleVoteThread(value)}
              />
              {!isAuthenticated ? (
                <div className="text-xs text-gray-500">Log in to vote.</div>
              ) : null}
              {voteError ? (
                <div className="text-sm text-red-600">{voteError}</div>
              ) : null}
            </div>
            {isEditingThread ? (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="edit-thread-title"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Title
                  </label>
                  <input
                    id="edit-thread-title"
                    type="text"
                    value={threadTitleInput}
                    onChange={(event) => setThreadTitleInput(event.target.value)}
                    className="mt-1 w-full rounded-xs border p-2 text-sm"
                    data-testid="thread-edit-title-input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-thread-content"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Content
                  </label>
                  <textarea
                    id="edit-thread-content"
                    value={threadContentInput}
                    onChange={(event) => setThreadContentInput(event.target.value)}
                    className="mt-1 min-h-32 w-full rounded-xs border p-2 text-sm"
                    data-testid="thread-edit-content-input"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={
                      !threadTitleInput.trim() ||
                      !threadContentInput.trim() ||
                      threadActionTarget === "update"
                    }
                    onClick={() => void handleSubmitEditThread()}
                    className="rounded-xs bg-blue-700 px-4 py-2 text-sm text-white disabled:opacity-50"
                    data-testid="thread-edit-submit"
                  >
                    {threadActionTarget === "update" ? "Saving..." : "Save Thread"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditThread}
                    className="rounded-xs bg-gray-200 px-4 py-2 text-sm text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-6 text-gray-800">
                {thread.content}
              </div>
            )}
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
                    data-testid="main-reply-input"
                  />
                  {mainReplyError ? (
                    <div className="mt-2 text-sm text-red-600">{mainReplyError}</div>
                  ) : null}
                  <button
                    type="button"
                    disabled={!mainReplyContent.trim() || isSubmittingMain}
                    onClick={() => void handleSubmitMainReply()}
                    className="mt-3 rounded-xs bg-blue-700 px-4 py-2 text-sm text-white disabled:opacity-50"
                    data-testid="main-reply-submit"
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
                  canVote={canVote}
                  voteLoadingTarget={voteLoadingTarget}
                  onVotePost={handleVotePost}
                  canManagePost={canManagePost}
                  activeEditPostId={activeEditPostId}
                  editPostContent={editPostContent}
                  postActionTarget={postActionTarget}
                  postActionError={postActionError}
                  postActionErrorTarget={postActionErrorTarget}
                  onEditPost={handleStartEditPost}
                  onCancelEditPost={handleCancelEditPost}
                  onEditPostContentChange={setEditPostContent}
                  onSubmitEditPost={handleSubmitEditPost}
                  onDeletePost={handleDeletePost}
                />
              ))
            )}
          </section>
        </div>
      </article>
    </div>
  );
}
