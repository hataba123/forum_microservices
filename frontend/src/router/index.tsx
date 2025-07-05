import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import HomePage from "../pages/HomePage";
import RegisterPage from "../pages/RegisterPage";
// import ThreadDetailPage from "../pages/ThreadDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // Layout gốc(có thể chứa <Outlet />)
    children: [
      {
        index: true, // tương đương path: "/"
        element: <HomePage />,
      },
      {
        // path: "thread/:id", // ví dụ: /thread/123
        // element: <ThreadDetailPage />,
      },
      {
        path: "register",
        element: <RegisterPage />, // Hiển thị tại "/register"
      },
    ],
  },
]);
