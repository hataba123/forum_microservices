import { apiClient } from "./apiClient";
import type { VoteResponse, VoteType, VoteValue } from "../types/forum";

export const voteService = {
  async voteThread(threadId: string, value: VoteValue) {
    const response = await apiClient.post<VoteResponse>("/votes", {
      type: "THREAD",
      threadId,
      value,
    });
    return response.data;
  },

  async votePost(postId: string, value: VoteValue) {
    const response = await apiClient.post<VoteResponse>("/votes", {
      type: "POST",
      postId,
      value,
    });
    return response.data;
  },

  async deleteVote(targetId: string, type: VoteType) {
    const response = await apiClient.delete<VoteResponse>(`/votes/${targetId}/${type}`);
    return response.data;
  },
};
