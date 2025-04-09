// src/components/Register.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormInput from "../ui/FormInput";
import { useCheckToken } from "../components/Checker";
import { isEmailValid } from "../utils/isEmailValid";
import { isPasswordValid } from "../utils/isPasswordValid";
import { checkPasswordStrength } from "../utils/checkPasswordStrength";
import { registerUser } from "../api/registerUser";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  useCheckToken();
  const navigate = useNavigate();

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isEmailValid(email)) {
      alert("Email non valide");
      return;
    }

    if (!isPasswordValid(password)) {
      alert("Le mot de passe ne respecte pas la politique de sécurité");
      return;
    }

    const payload = { username, email, password };

    try {
      const response = await registerUser(payload);
      if (response.status === 201) {
        navigate("/login");
      }
    } catch (error: any) {
      console.error("Erreur lors de la requête:", error);
      alert(error.message || "Erreur lors de l'inscription");
    }
  };

  // Mise à jour du mot de passe et de sa force en temps réel
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(checkPasswordStrength(pwd));
  };

  return (
    <div className="min-h-screen bg-[#17202A] text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8">Créer votre compte</h1>

      <form className="w-full max-w-sm flex flex-col gap-4 mb-8" onSubmit={handleSubmit}>
        <FormInput
          label="Nom d'utilisateur"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <FormInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <FormInput
          label="Mot de passe"
          type="password"
          value={password}
          onChange={handlePasswordChange}
        />
        
        {password && (
          <div className="text-sm">
            Force du mot de passe : <span>{passwordStrength}</span>
          </div>
        )}

        <div className="flex w-full max-w-sm justify-between">
          <Link to="/landing">
            <button
              type="button"
              className="px-4 py-2 border border-gray-500 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 active:bg-gray-600 transition"
            >
              Retour
            </button>
          </Link>
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-white text-black font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 active:bg-gray-300 transition"
          >
            S'inscrire
          </button>
        </div>
      </form>
    </div>
  );
}

export default Register;
