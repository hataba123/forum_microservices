import type { UserRole } from "./auth";

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  slug: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadAuthor {
  id: string;
  username: string;
  email: string;
  avatar?: string | null;
  role?: UserRole;
}

export interface ThreadCategory {
  id: string;
  name: string;
  description?: string | null;
  slug: string;
}

export interface Thread {
  id: string;
  title: string;
  slug: string;
  content: string;
  authorId: string;
  categoryId: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author?: ThreadAuthor;
  category?: ThreadCategory;
  _count?: {
    posts?: number;
  };
  upvotes?: number;
  downvotes?: number;
  voteScore?: number;
  currentUserVote?: number;
  voteStats?: {
    upvotes: number;
    downvotes: number;
    score: number;
    total: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  pages?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ThreadQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  categorySlug?: string;
  search?: string;
  authorId?: string;
  isPinned?: boolean;
}
