import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../services/apiClient";
import { useAuth } from "../stores/useAuth";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim() || !email.trim() || !password) {
      setError("Please enter username, email, and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const authResult = await register({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      if (authResult) {
        navigate("/");
        return;
      }

      setSuccess("Registration succeeded. Please log in.");
    } catch (registerError) {
      setError(getApiErrorMessage(registerError, "Registration failed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="bg-gray-100 p-6 rounded shadow-lg max-w-7xl w-full relative">
        <h2 className="text-2xl text-left text-blue-800 mb-6">Register</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center">
            <label className="w-4/12 text-right mr-3 text-gray-700">
              Username:
            </label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="flex-1 p-2 border rounded-xs"
              autoComplete="username"
            />
          </div>

          <div className="flex items-center">
            <label className="w-4/12 text-right mr-3 text-gray-700">
              Email:
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="flex-1 p-2 border rounded-xs"
              autoComplete="email"
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
              className="flex-1 border p-2 rounded-xs"
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-center">
            <label className="w-4/12 text-right mr-3 text-gray-700">
              Day of Birth:
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className="flex-1 p-2 border rounded-xs"
            />
          </div>

          {error ? (
            <div className="text-center text-sm text-red-600">{error}</div>
          ) : null}
          {success ? (
            <div className="text-center text-sm text-green-700">{success}</div>
          ) : null}

          <div className="w-fit mx-auto h-7 flex justify-center bg-blue-600 rounded-xs">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 text-white py-2 px-4 hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
