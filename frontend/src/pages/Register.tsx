import React, { useState } from "react";
import { Link } from "react-router-dom";
import FormInput from "../ui/FormInput";

function Register() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
  return (
    <div className="min-h-screen bg-[#17202A] text-white flex flex-col items-center justify-center p-4">

      {/* Titre */}
      <h1 className="text-2xl font-bold mb-8">Créer votre compte</h1>

      {/* Formulaire */}
      <form className="w-full max-w-sm flex flex-col gap-4 mb-8">
        <FormInput
          label="Nom et prénom"
          type="text"
        />
        <FormInput
          label="Email"
          type="email"
        />
        <FormInput
          label="Mot de passe"
          type="password"
        />
        <FormInput
          label="Date de naissance"
          type="date"
        />
      </form>

      {/* Boutons avec états hover/focus/active */}
      <div className="flex w-full max-w-sm justify-between">
        <Link to="/">
          <button
            type="button"
            className="px-4 py-2 border border-gray-500 rounded-full 
                       text-white 
                       hover:bg-gray-700 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 
                       active:bg-gray-600 
                       transition"
          >
            Retour
          </button>
        </Link>
        <button
          type="button"
          className="px-4 py-2 rounded-full bg-white text-black 
                     font-semibold 
                     hover:bg-gray-200 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 
                     active:bg-gray-300 
                     transition"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

export default Register;
