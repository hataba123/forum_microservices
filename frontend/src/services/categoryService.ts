import { apiClient } from "./apiClient";
import type { Category } from "../types/forum";

export const categoryService = {
  async getCategories() {
    const response = await apiClient.get<Category[]>("/categories");
    return response.data;
  },
};
