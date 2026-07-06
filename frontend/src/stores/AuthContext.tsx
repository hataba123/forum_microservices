import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getApiErrorMessage } from "../services/apiClient";
import { authService } from "../services/authService";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "../services/tokenStorage";
import type { LoginRequest, RegisterRequest, User } from "../types/auth";
import { AuthContext, type AuthContextValue } from "./authContextValue";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setTokenState] = useState<string | null>(() => getAccessToken());
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    clearAccessToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const loadMe = useCallback(async () => {
    const token = getAccessToken();

    if (!token) {
      clearAuth();
      return null;
    }

    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
      setTokenState(token);
      return currentUser;
    } catch {
      clearAuth();
      return null;
    }
  }, [clearAuth]);

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        await loadMe();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [loadMe]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuth();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [clearAuth]);

  const login = useCallback(async (payload: LoginRequest) => {
    const result = await authService.login(payload);
    setAccessToken(result.accessToken);
    setTokenState(result.accessToken);
    setUser(result.user);
    return result;
  }, []);

  const register = useCallback(
    async (payload: RegisterRequest) => {
      await authService.register(payload);

      try {
        return await login({
          email: payload.email,
          password: payload.password,
        });
      } catch (error) {
        console.warn(getApiErrorMessage(error, "Registered but auto login failed"));
        return null;
      }
    },
    [login]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    clearAuth();
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      login,
      register,
      logout,
      loadMe,
    }),
    [accessToken, isLoading, loadMe, login, logout, register, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
