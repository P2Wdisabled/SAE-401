import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  exp: number;
  // Vous pouvez ajouter d'autres propriétés du payload si besoin
}

function useCheckToken() {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    // On définit les routes d'authentification
    const authRoutes = ["/login", "/register", "/landing"];
    const isAuthPage = authRoutes.includes(location.pathname);

    if (token) {
      try {
        const decoded = jwtDecode<JWTPayload>(token);
        // Vérifier si le token est expiré (exp est en secondes)
        if (decoded.exp * 1000 < Date.now()) {
          // Token expiré
          localStorage.removeItem("token");
          if (!isAuthPage) {
            // Sur une page protégée et token invalide => redirection vers /landing
            navigate("/landing");
          }
        } else {
          // Token valide
          if (isAuthPage) {
            // Sur une page d'auth (login, register, landing) avec token valide => redirection vers /
            navigate("/");
          }
        }
      } catch (error) {
        console.error("Erreur lors du décodage du token:", error);
        localStorage.removeItem("token");
        if (!isAuthPage) {
          // En cas d'erreur de décodage et sur une page protégée => redirection vers /landing
          navigate("/landing");
        }
      }
    } else {
      // Aucun token présent
      if (!isAuthPage) {
        // Sur une page protégée sans token => redirection vers /landing
        navigate("/landing");
      }
    }
  }, [navigate, location.pathname]);
}

export default useCheckToken;
