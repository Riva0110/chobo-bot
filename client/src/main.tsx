import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.tsx";
import Home from "./pages/Home";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // 根組件包 Layout
    children: [
      { path: "/", element: <Home /> }, // Outlet 會渲染 Home
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
