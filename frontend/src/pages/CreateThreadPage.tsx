import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../services/apiClient";
import { categoryService } from "../services/categoryService";
import { threadService } from "../services/threadService";
import { useAuth } from "../stores/useAuth";
import type { Category } from "../types/forum";

export default function CreateThreadPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      setIsLoadingCategories(true);
      setError("");

      try {
        const response = await categoryService.getCategories();

        if (isMounted) {
          setCategories(response);
          setCategoryId((current) => current || response[0]?.id || "");
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getApiErrorMessage(loadError, "Could not load categories."));
        }
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const isFormValid = useMemo(
    () => Boolean(categoryId && trimmedTitle && trimmedContent),
    [categoryId, trimmedContent, trimmedTitle]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setError("You need to log in to create a thread.");
      return;
    }

    if (!categoryId) {
      setError("Category is required.");
      return;
    }

    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    if (!trimmedContent) {
      setError("Content is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const createdThread = await threadService.createThread({
        categoryId,
        title: trimmedTitle,
        content: trimmedContent,
      });

      setSuccessMessage("Thread created. Redirecting...");
      navigate(`/threads/${createdThread.id}`);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Could not create thread."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-xs bg-gray-100 p-4 text-gray-600 shadow">
          Checking session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4">
          <Link to="/threads" className="text-sm text-blue-700 hover:underline">
            Back to threads
          </Link>
        </div>

        <section className="rounded-xs bg-gray-100 p-4 shadow">
          <h1 className="text-xl font-bold text-blue-800">Create Thread</h1>
          <p className="mt-2 text-sm text-gray-700">
            You need to log in before creating a thread. Use the Log in button in
            the header or{" "}
            <Link to="/register" className="text-blue-700 hover:underline">
              register
            </Link>
            .
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4">
        <Link to="/threads" className="text-sm text-blue-700 hover:underline">
          Back to threads
        </Link>
      </div>

      <section className="rounded-xs bg-gray-100 shadow">
        <div className="rounded-t-xl bg-white px-4 py-4">
          <h1 className="text-xl font-bold text-blue-800">Create Thread</h1>
          <p className="mt-1 text-sm text-gray-600">
            Start a new discussion with a title, category, and first post.
          </p>
        </div>

        <form className="space-y-4 p-4" onSubmit={handleSubmit}>
          {error ? (
            <div className="rounded-xs border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-xs border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="thread-category"
              className="block text-sm font-semibold text-gray-700"
            >
              Category
            </label>
            <select
              id="thread-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              disabled={isLoadingCategories || isSubmitting}
              className="mt-1 w-full rounded-xs border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-60"
            >
              {isLoadingCategories ? (
                <option value="">Loading categories...</option>
              ) : null}
              {!isLoadingCategories && categories.length === 0 ? (
                <option value="">No categories available</option>
              ) : null}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="thread-title"
              className="block text-sm font-semibold text-gray-700"
            >
              Title
            </label>
            <input
              id="thread-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isSubmitting}
              className="mt-1 w-full rounded-xs border border-gray-300 px-3 py-2 text-sm disabled:opacity-60"
              placeholder="Thread title"
            />
          </div>

          <div>
            <label
              htmlFor="thread-content"
              className="block text-sm font-semibold text-gray-700"
            >
              Content
            </label>
            <textarea
              id="thread-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              disabled={isSubmitting}
              className="mt-1 min-h-40 w-full rounded-xs border border-gray-300 px-3 py-2 text-sm disabled:opacity-60"
              placeholder="Write the first post..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={!isFormValid || isLoadingCategories || isSubmitting}
              className="rounded-xs bg-blue-700 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Thread"}
            </button>
            <Link
              to="/threads"
              className="rounded-xs bg-gray-200 px-4 py-2 text-sm text-gray-700"
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
