import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addNewPost } from "../components/PostMessage";

function Post() {
  // État local pour stocker le texte du tweet
  const [text, setText] = useState("");
  const navigate = useNavigate();

  // Handler pour la saisie du tweet, limité à 280 caractères
  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = event.target.value;
    setText(newValue.slice(0, 280));
  }

  // Au clic sur "Poster"
  function handleSubmit() {
    if (text.trim().length === 0) {
      return; // on empêche de poster un tweet vide
    }
    addNewPost(text);   // on ajoute le post au tableau en mémoire
    navigate("/");      // on revient sur la page d'accueil
  }

  return (
    <div className="bg-[#17202A] min-h-screen text-white flex flex-col">
      {/* En-tête */}
      <header className="flex items-center justify-between p-4 border-b border-gray-700">
        {/* Bouton de fermeture (croix) */}
        <Link to="/">
          <button
            className="text-2xl hover:bg-gray-800 p-2 rounded-full"
            title="Fermer"
          >
            &#10005; {/* Symbole X */}
          </button>
        </Link>

        {/* Bouton "Poster" */}
        <button
          className="bg-[#1DA1F2] px-4 py-2 rounded-full font-semibold hover:bg-[#1A91DA] transition"
          title="Poster ce tweet"
          onClick={handleSubmit}
        >
          Poster
        </button>
      </header>

      {/* Zone de texte - Container centré verticalement */}
      <div className="flex-1 flex items-center justify-center px-4">
        {/* Cadre englobant le textarea et son compteur */}
        <div className="w-full max-w-md border border-gray-600 p-2 relative">
          <textarea
            className="w-full h-64 bg-transparent text-white outline-none resize-none placeholder-gray-400"
            placeholder="Quoi de neuf ?"
            maxLength={280}
            value={text}
            onChange={handleChange}
          />
          {/* Compteur de caractères en haut à droite */}
          <span className="absolute top-2 right-2 text-sm text-gray-400">
            {text.length}/280
          </span>
        </div>
      </div>
    </div>
  );
}

export default Post;
