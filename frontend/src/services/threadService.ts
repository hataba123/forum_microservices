import { apiClient } from "./apiClient";
import type { PaginatedResponse, Thread, ThreadQueryParams } from "../types/forum";

function buildThreadQuery(params: ThreadQueryParams = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  return query.toString();
}

export const threadService = {
  async getThreads(params: ThreadQueryParams = {}) {
    const query = buildThreadQuery(params);
    const response = await apiClient.get<PaginatedResponse<Thread>>(
      `/threads${query ? `?${query}` : ""}`
    );
    return response.data;
  },
};
