import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function useCheckToken() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    // Définition des routes d'authentification (pages publiques)
    const authRoutes = ["/login", "/register", "/landing"];
    const isAuthPage = authRoutes.includes(location.pathname);

    if (token) {
      // Si un token est présent et qu'on est sur une page d'auth, redirige vers la home
      if (isAuthPage) {
        navigate("/");
      }
    } else {
      // Si aucun token n'est trouvé et que l'on se trouve sur une page protégée, redirige vers /landing
      if (!isAuthPage) {
        navigate("/landing");
      }
    }
  }, [navigate, location.pathname]);
}

export default useCheckToken;
