import type { User } from "../types/auth";

export function canManageContent(
  currentUser: User | null | undefined,
  authorId: string | null | undefined
) {
  if (!currentUser) {
    return false;
  }

  if (authorId && currentUser.id === authorId) {
    return true;
  }

  return currentUser.role === "ADMIN" || currentUser.role === "MODERATOR";
}
