import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function checkToken() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const tokenExpiration = localStorage.getItem("expiration");
    let isTokenValid = false;

    if (tokenExpiration) {
      try {
        const expirationObj = JSON.parse(tokenExpiration);
        // Reformate la date pour respecter le format ISO 8601 (remplace l'espace par un "T" et ajoute "Z" pour UTC)
        const formattedDate = expirationObj.date.replace(" ", "T") + "Z";
        const expirationDate = new Date(formattedDate);
        // Comparaison de la date d'expiration avec la date actuelle
        isTokenValid = expirationDate.getTime() > Date.now();
      } catch (error) {
        console.error("Erreur lors de l'analyse de tokenExpiration:", error);
      }
    }

    // Définition des routes d'authentification (pages publiques)
    const authRoutes = ["/login", "/register", "/landing"];
    const isAuthPage = authRoutes.includes(location.pathname);

    if (token && isTokenValid) {
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

function checkAdmin() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }

    // Appel vers un endpoint qui vérifie si l'utilisateur est admin
    fetch("http://localhost:8080/admin/verify", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    })
      .then((response) => {
        if (response.status === 401) {
          // Non authentifié
          navigate("/landing");
          throw new Error("Not authenticated");
        } else if (response.status === 403) {
          // Authentifié mais pas admin
          navigate("/");
          throw new Error("Access denied");
        } else if (!response.ok) {
          throw new Error("Erreur lors de la vérification des droits d'administration");
        }
        return response.json();
      })
      .then((data) => {
        // Si l'endpoint retourne { admin: false } par exemple, rediriger vers la home
        if (!data.admin) {
          navigate("/");
        }
      })
      .catch((error) => {
        console.error("Erreur dans checkAdmin:", error);
      });
  }, [navigate, location.pathname]);
}

export { checkToken, checkAdmin };
