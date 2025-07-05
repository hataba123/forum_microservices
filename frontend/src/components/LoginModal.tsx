import React from "react";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <div className="bg-gray-100 p-3 rounded shadow-lg max-w-3xl w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-black hover:text-black text-xl"
        >
          &times;
        </button>

        <h2 className="text-2xl text-left text-blue-800 mb-4">Log in</h2>

        <form className="space-y-4">
          {/* Nhóm Tên đăng nhập */}
          <div className="flex items-center">
            <label className="w-4/12 text-right mr-3 text-gray-700">
              Your name and email address:
            </label>
            <input type="text" className="flex-1 border p-2 rounded" />
          </div>

          {/* Nhóm Mật khẩu */}
          <div className="flex items-center">
            <label className="w-4/12 text-right mr-3 text-gray-700">
              Password:
            </label>
            <input type="password" className="flex-1 border p-2 rounded" />
          </div>
          {/* Forgot password */}
          <div className="text-center text-sm hover:underline">
            <a
              href="#"
              className="!text-blue-800 hover:underline"
              onClick={() => console.log("Forgot password clicked")}
            >
              Forgot your password?
            </a>
          </div>

          {/* Nút đăng nhập */}
          <div className="w-fit mx-auto text-sm h-7 flex justify-center bg-blue-800 rounded-xs">
            <button
              type="submit"
              className="flex items-center gap-2 text-white py-2 px-4 hover:bg-blue-700 "
            >
              <LockClosedIcon className="w-4 h-4" />
              Log in
            </button>
          </div>

          {/* Dòng đăng ký */}
          <div className="flex items-center justify-center pt-1 text-sm gap-2 text-gray-700">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-white px-3 py-1 !rounded-xs !bg-blue-900  text-sm"
              onClick={() => {
                onClose(); // 👈 Đóng modal trước
                navigate("/register"); // 👈 Sau đó chuyển trang
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
