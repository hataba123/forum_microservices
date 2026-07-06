import { createContext } from "react";
import type {
  AuthResponse,
  AuthState,
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/auth";

export interface AuthContextValue extends AuthState {
  login: (payload: LoginRequest) => Promise<AuthResponse>;
  register: (payload: RegisterRequest) => Promise<AuthResponse | null>;
  logout: () => Promise<void>;
  loadMe: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
