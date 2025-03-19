import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  exp: number;
  // Vous pouvez ajouter d'autres propriétés du payload si besoin
}

function useCheckToken() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<JWTPayload>(token);
        // Vérifier si le token est expiré (exp est en secondes)
        if (decoded.exp * 1000 < Date.now()) {
          // Token expiré, on le supprime et on redirige éventuellement vers la page de login
          localStorage.removeItem("token");
        } else {
          // Token valide, on redirige vers /home
          navigate("/");
        }
      } catch (error) {
        console.error("Erreur lors du décodage du token:", error);
        localStorage.removeItem("token");
      }
    }
  }, [navigate]);
}

export default useCheckToken;
