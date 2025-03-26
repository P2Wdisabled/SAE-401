import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {useCheckToken} from "../components/Checker"; // Adapté selon votre arborescence
import Button from "../ui/Button";

function Post() {
  // État local pour stocker le texte du post
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  useCheckToken();
  const navigate = useNavigate();
  // Handler pour la saisie du post, limité à 280 caractères
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setText(newValue.slice(0, 280));
  };

  // Au clic sur "Poster", on envoie le post vers le backend
  const handleSubmit = async () => {
    if (text.trim().length === 0) {
      setError("Le post ne peut pas être vide.");
      return;
    }
  
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Utilisateur non authentifié.");
      return;
    }
    try {
      const response = await fetch("http://localhost:8080/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        body: JSON.stringify({ content: text }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        navigate("/");
      } else if (data.errors) {
        // Si erreurs de validation
        const allErrors = Object.values(data.errors).join(" ");
        setError(allErrors);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("Une erreur inconnue est survenue.");
      }
    } catch (err) {
      console.error("Erreur lors de la requête:", err);
      setError("Erreur réseau, veuillez réessayer plus tard.");
    }
  };
  

  return (
    <div className="bg-[#17202A] min-h-screen text-white flex flex-col">
      {/* En-tête */}
      <header className="flex items-center justify-between p-4 border-b border-gray-700">
        {/* Bouton de fermeture (croix) */}
        <Button page="/" text="&#10005;" bg="transparent" moreClasses="text-2xl hover:bg-gray-800 p-2 rounded-full" />

        {/* Bouton "Poster" */}
        <Button text="Poster" bg="bg-primary" moreClasses=" px-4 py-2 rounded-full font-semibold hover:bg-[#1A91DA] transition" 
          onClick={handleSubmit} />
      </header>

      {/* Zone de texte */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-gray-600 p-2 relative">
          <textarea
            className="w-full h-64 bg-transparent text-white outline-none resize-none placeholder-gray-400"
            placeholder="Quoi de neuf ?"
            maxLength={280}
            value={text}
            onChange={handleChange}
          />
          <span className="absolute top-2 right-2 text-sm text-gray-400">
            {text.length}/280
          </span>
        </div>
      </div>
      {/* Affichage d'une éventuelle erreur */}
      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
    </div>
  );
}

export default Post;
