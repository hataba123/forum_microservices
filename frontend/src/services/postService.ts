import { apiClient } from "./apiClient";
import type { PaginatedResponse, Post, PostQueryParams } from "../types/forum";

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
};
