import React, { useState } from "react";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../services/apiClient";
import { useAuth } from "../stores/useAuth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });
      onClose();
    } catch (loginError) {
      setError(getApiErrorMessage(loginError, "Login failed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      data-testid="login-modal"
    >
      <div className="bg-gray-100 p-3 rounded shadow-lg max-w-3xl w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-black hover:text-black text-xl"
        >
          &times;
        </button>

        <h2 className="text-2xl text-left text-blue-800 mb-4">Log in</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center">
            <label className="w-4/12 text-right mr-3 text-gray-700">
              Your email address:
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="flex-1 border p-2 rounded"
              autoComplete="email"
              data-testid="login-email"
            />
          </div>

          <div className="flex items-center">
            <label className="w-4/12 text-right mr-3 text-gray-700">
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="flex-1 border p-2 rounded"
              autoComplete="current-password"
              data-testid="login-password"
            />
          </div>

          {error ? (
            <div className="text-center text-sm text-red-600">{error}</div>
          ) : null}

          <div className="text-center text-sm hover:underline">
            <a
              href="#"
              className="!text-blue-800 hover:underline"
              onClick={(event) => event.preventDefault()}
            >
              Forgot your password?
            </a>
          </div>

          <div className="w-fit mx-auto text-sm h-7 flex justify-center bg-blue-800 rounded-xs">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 text-white py-2 px-4 hover:bg-blue-700 disabled:opacity-60"
              data-testid="login-submit"
            >
              <LockClosedIcon className="w-4 h-4" />
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>
          </div>

          <div className="flex items-center justify-center pt-1 text-sm gap-2 text-gray-700">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-white px-3 py-1 !rounded-xs !bg-blue-900 text-sm"
              onClick={() => {
                onClose();
                navigate("/register");
              }}
            >
              Register Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
