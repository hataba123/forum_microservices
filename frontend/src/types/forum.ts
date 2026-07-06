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

export interface VoteSummary {
  upvotes: number;
  downvotes: number;
  score: number;
  total: number;
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
  voteStats?: VoteSummary;
}

export interface PostAuthor {
  id: string;
  username: string;
  email?: string;
  avatar?: string | null;
  role?: UserRole;
}

export interface PostThread {
  id: string;
  title: string;
  slug: string;
  isLocked?: boolean;
}

export interface Post {
  id: string;
  content: string;
  authorId: string;
  threadId: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: PostAuthor;
  thread?: PostThread;
  parent?: {
    id: string;
    content: string;
  } | null;
  children?: Post[];
  _count?: {
    votes?: number;
    children?: number;
  };
  upvotes?: number;
  downvotes?: number;
  voteScore?: number;
  currentUserVote?: number;
  voteStats?: VoteSummary;
}

export interface ThreadDetail extends Thread {
  posts?: Post[];
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

export interface PostQueryParams {
  threadId?: string;
  page?: number;
  limit?: number;
  parentId?: string;
  authorId?: string;
  sort?: "newest" | "oldest";
}
