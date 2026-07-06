import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import HomePage from "../pages/HomePage";
import RegisterPage from "../pages/RegisterPage";
import ThreadsPage from "../pages/ThreadsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "threads",
        element: <ThreadsPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
    ],
  },
]);
