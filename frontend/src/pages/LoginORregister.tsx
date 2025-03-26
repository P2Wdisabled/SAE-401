import React from "react";
import { Link } from "react-router-dom";
import Button from "../ui/Button";
import {useCheckToken} from "../components/Checker"; // Adapté selon votre arborescence

function Landing() {
  useCheckToken();

  return (
    <div className="min-h-screen bg-[#17202A] text-white flex flex-col items-center justify-center p-4">
      {/* Titre principal */}
      <h1 className="text-2xl font-bold mb-6 text-center max-w-md">
        Découvrez ce qui se passe dans le monde en temps réel.
      </h1>

      {/* Bouton "Créez un compte" */}
      
        <Button page="/register" text="Créez un compte" />

      {/* Mentions légales */}
      <div className="mt-6 text-gray-400 text-sm text-center max-w-sm leading-relaxed">
        <p>
          En vous inscrivant, vous acceptez nos{" "}
          <Link to="/terms" className="text-[#1DA1F2] hover:underline">
            conditions d’utilisation
          </Link>
          , notre{" "}
          <Link to="/privacy" className="text-[#1DA1F2] hover:underline">
            Politique de confidentialité
          </Link>{" "}
          et notre{" "}
          <Link to="/cookies" className="text-[#1DA1F2] hover:underline">
            Utilisation des cookies
          </Link>
          .
        </p>
      </div>

      {/* Lien pour se connecter */}
      <div className="mt-4 text-gray-400 text-sm">
        <p>
          Vous avez déjà un compte ?{" "}
          <Link to="/login" className="text-[#1DA1F2] hover:underline">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Landing;
