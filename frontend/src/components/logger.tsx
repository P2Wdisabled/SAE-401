// src/components/logger.tsx
import React from "react"
import { useNavigate } from "react-router-dom";

export function useLogout() {
  const navigate = useNavigate();

  const logout = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    fetch("http://localhost:8080/logout", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur lors de la déconnexion");
        }
        return response.json();
      })
      .then(() => {
        localStorage.removeItem("token");
        navigate("/landing");
      })
      .catch((error) => {
        console.error("Erreur lors de la déconnexion :", error);
      });
  };

  return logout;
}
