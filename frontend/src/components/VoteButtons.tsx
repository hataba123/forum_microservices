import type { VoteValue } from "../types/forum";

interface VoteButtonsProps {
  score: number;
  upvotes: number;
  downvotes: number;
  currentUserVote: number;
  disabled?: boolean;
  isLoading?: boolean;
  testIdPrefix?: string;
  onVote: (value: VoteValue) => void;
}

export default function VoteButtons({
  score,
  upvotes,
  downvotes,
  currentUserVote,
  disabled = false,
  isLoading = false,
  testIdPrefix,
  onVote,
}: VoteButtonsProps) {
  const baseButtonClass =
    "rounded-xs border px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => onVote(1)}
        className={`${baseButtonClass} ${
          currentUserVote === 1
            ? "border-green-600 bg-green-50 text-green-700"
            : "border-gray-200 bg-gray-100 text-gray-700"
        }`}
        title="Upvote"
        data-testid={testIdPrefix ? `${testIdPrefix}-upvote` : undefined}
      >
        Up {upvotes}
      </button>
      <span className="rounded-xs bg-gray-100 px-2 py-1 font-semibold">
        Score {isLoading ? "..." : score}
      </span>
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => onVote(-1)}
        className={`${baseButtonClass} ${
          currentUserVote === -1
            ? "border-red-600 bg-red-50 text-red-700"
            : "border-gray-200 bg-gray-100 text-gray-700"
        }`}
        title="Downvote"
        data-testid={testIdPrefix ? `${testIdPrefix}-downvote` : undefined}
      >
        Down {downvotes}
      </button>
      <span
        className="rounded-xs bg-blue-50 px-2 py-1 text-blue-700"
        data-testid={testIdPrefix ? `${testIdPrefix}-current-vote` : undefined}
      >
        Your vote {currentUserVote}
      </span>
    </div>
  );
}
