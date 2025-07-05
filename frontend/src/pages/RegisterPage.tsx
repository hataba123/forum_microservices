import React from "react";

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="bg-gray-100 p-6 rounded shadow-lg max-w-7xl w-full  relative">
        <h2 className="text-2xl text-left text-blue-800 mb-6">Register</h2>

        <form className="space-y-4">
          {/* Username */}
          <div className="flex items-center">
            <label className="w-4/12 text-right mr-3 text-gray-700">
              Username:
            </label>
            <input type="text" className="flex-1  p-2 border rounded-xs" />
          </div>

          {/* Name & Email */}
          <div className="flex items-center">
            <label className="w-4/12 text-right mr-3 text-gray-700">
              Name and Email:
            </label>
            <input type="text" className="flex-1  p-2 border rounded-xs" />
          </div>

          {/* Password */}
          <div className="flex items-center">
            <label className="w-4/12 text-right mr-3 text-gray-700">
              Password:
            </label>
            <input type="password" className="flex-1 border p-2 rounded-xs" />
          </div>

          {/* Day of Birth */}
          <div className="flex items-center">
            <label className="w-4/12 text-right mr-3 text-gray-700">
              Day of Birth:
            </label>
            <input type="date" className="flex-1  p-2 border rounded-xs" />
          </div>

          {/* Register Button */}
          <div className="w-fit mx-auto h-7 flex justify-center bg-blue-600 rounded-xs">
            <button
              type="submit"
              className="flex items-center gap-2 text-white py-2 px-4 hover:bg-blue-700"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
