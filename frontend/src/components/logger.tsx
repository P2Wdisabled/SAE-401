// src/components/logger.tsx
import React from "react"
import { useNavigate } from "react-router-dom";
const baseUrl = import.meta.env.VITE_API_URL;


export function useLogout() {
  const navigate = useNavigate();

  const logout = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    fetch(baseUrl+"logout", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error during logout");
        }
        return response.json();
      })
      .then(() => {
        localStorage.removeItem("token");
        navigate("/landing");
      })
      .catch((error) => {
        console.error("Error during logout:", error);
      });
  };

  return logout;
}
