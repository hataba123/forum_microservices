import { apiClient } from "./apiClient";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  User,
} from "../types/auth";
import { clearAccessToken } from "./tokenStorage";

export const authService = {
  async login(payload: LoginRequest) {
    const response = await apiClient.post<AuthResponse>("/auth/login", payload);
    return response.data;
  },

  async register(payload: RegisterRequest) {
    const response = await apiClient.post<RegisterResponse>("/auth/register", payload);
    return response.data;
  },

  async getMe() {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },

  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      clearAccessToken();
    }
  },
};
