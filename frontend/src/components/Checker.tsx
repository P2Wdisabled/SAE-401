// src/components/Checker.tsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
const baseUrl = import.meta.env.VITE_API_URL;

export function useCheckToken() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Public pages: login, register, landing
    const authRoutes = ["/login", "/register", "/landing"];
    const isAuthPage = authRoutes.includes(location.pathname);

    if (!token) {
      // If no token is found, redirect to /landing on protected pages
      if (!isAuthPage) {
        navigate("/landing");
      }
      return;
    }

    // If we are on an administration page, verify via the backend that the user is an admin
    if (location.pathname.startsWith("/admin")) {
      fetch(baseUrl+"admin/verify", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
      })
        .then((response) => {
          if (response.status === 401) {
            // Invalid token
            if (!isAuthPage) {
              navigate("/landing");
            }
            throw new Error("Not authenticated");
          } else if (response.status === 403) {
            // Valid token but not admin
            navigate("/");
            throw new Error("Access denied");
          } else if (!response.ok) {
            throw new Error("Error while verifying admin rights");
          }
          return response.json();
        })
        .then((data) => {
          // If the endpoint returns { admin: false }, redirect to the home page
          if (!data.admin) {
            navigate("/");
          }
        })
        .catch((error) => {
          console.error("Error in useCheckToken (admin):", error);
        });
    }
    // For other pages, if the token is present, access is allowed
  }, [navigate, location.pathname]);
}
