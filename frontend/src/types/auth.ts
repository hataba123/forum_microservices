export type UserRole = "USER" | "MODERATOR" | "ADMIN";

export interface User {
  id: string;
  username: string;
  email: string;
  role?: UserRole;
  avatar?: string | null;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: Pick<User, "id" | "username" | "email">;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
