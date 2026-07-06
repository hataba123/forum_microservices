import { apiClient } from "./apiClient";
import type {
  CreatePostRequest,
  DeleteResponse,
  PaginatedResponse,
  Post,
  PostQueryParams,
  UpdatePostRequest,
} from "../types/forum";

function buildPostQuery(params: PostQueryParams = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  return query.toString();
}

export const postService = {
  async getPosts(params: PostQueryParams = {}) {
    const query = buildPostQuery(params);
    const response = await apiClient.get<PaginatedResponse<Post>>(
      `/posts${query ? `?${query}` : ""}`
    );
    return response.data;
  },

  async createPost(input: CreatePostRequest) {
    const response = await apiClient.post<Post>("/posts", input);
    return response.data;
  },

  async updatePost(id: string, input: UpdatePostRequest) {
    const response = await apiClient.put<Post>(`/posts/${id}`, input);
    return response.data;
  },

  async deletePost(id: string) {
    const response = await apiClient.delete<DeleteResponse>(`/posts/${id}`);
    return response.data;
  },
};
