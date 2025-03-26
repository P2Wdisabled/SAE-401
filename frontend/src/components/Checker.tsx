// src/components/Checker.tsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function useCheckToken() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Pages publiques : login, register, landing
    const authRoutes = ["/login", "/register", "/landing"];
    const isAuthPage = authRoutes.includes(location.pathname);

    if (!token) {
      // Si aucun token n'est trouvé, rediriger vers /landing sur les pages protégées
      if (!isAuthPage) {
        navigate("/landing");
      }
      return;
    }

    // Si on est sur une page d'administration, vérifier via le backend que l'utilisateur est admin
    if (location.pathname.startsWith("/admin")) {
      fetch("http://localhost:8080/admin/verify", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
      })
        .then((response) => {
          if (response.status === 401) {
            // Token invalide
            if (!isAuthPage) {
              navigate("/landing");
            }
            throw new Error("Not authenticated");
          } else if (response.status === 403) {
            // Token valide mais pas admin
            navigate("/");
            throw new Error("Access denied");
          } else if (!response.ok) {
            throw new Error("Erreur lors de la vérification des droits d'administration");
          }
          return response.json();
        })
        .then((data) => {
          // Si l'endpoint retourne { admin: false }, rediriger vers la home
          if (!data.admin) {
            navigate("/");
          }
        })
        .catch((error) => {
          console.error("Erreur dans useCheckToken (admin):", error);
        });
    }
    // Pour les autres pages, si le token est présent, l'accès est autorisé
  }, [navigate, location.pathname]);
}
