import { apiClient } from "./apiClient";
import type {
  CreateThreadRequest,
  PaginatedResponse,
  Thread,
  ThreadDetail,
  ThreadQueryParams,
} from "../types/forum";

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

  async getThreadById(id: string) {
    const response = await apiClient.get<ThreadDetail>(`/threads/${id}`);
    return response.data;
  },

  async createThread(input: CreateThreadRequest) {
    const response = await apiClient.post<ThreadDetail>("/threads", input);
    return response.data;
  },
};
