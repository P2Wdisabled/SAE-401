import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormInput from "../ui/FormInput";
import useCheckToken from "../components/useCheckToken"; // Adapté selon votre arborescence

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  useCheckToken();
  const navigate = useNavigate();

  // Vérifie que l'email est au bon format
  const isEmailValid = (email: string): boolean => {
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
  };

  // Vérifie que le mot de passe respecte la politique de sécurité
  const isPasswordValid = (password: string): boolean => {
    const minLength = 8;
    const hasDigit = /[0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[\W_]/.test(password);
    return password.length >= minLength && hasDigit && hasUpper && hasLower && hasSpecial;
  };

  // Calcule la force du mot de passe pour affichage en temps réel
  const checkPasswordStrength = (password: string): string => {
    let strengthScore = 0;
    if (password.length >= 8) strengthScore++;
    if (/[A-Z]/.test(password)) strengthScore++;
    if (/[a-z]/.test(password)) strengthScore++;
    if (/[0-9]/.test(password)) strengthScore++;
    if (/[\W_]/.test(password)) strengthScore++;

    if (strengthScore <= 2) return "Faible";
    if (strengthScore === 3 || strengthScore === 4) return "Moyen";
    if (strengthScore === 5) return "Fort";
    return "";
  };

  // Gère la soumission du formulaire
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
      const response = await fetch("http://localhost:8080/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 201) {
        navigate("/login");
      } else {
        alert("Erreur lors de l'inscription");
      }
    } catch (error) {
      console.error("Erreur lors de la requête:", error);
      alert("Erreur lors de la requête");
    }
  };

  // Met à jour le mot de passe et sa force en temps réel
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
        />

        <FormInput
          label="Email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
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
            type="submit"
            className="px-4 py-2 rounded-full bg-white text-black 
                         font-semibold 
                         hover:bg-gray-200 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 
                         active:bg-gray-300 
                         transition"
          >
            S'inscrire
          </button>
        </div>
      </form>
    </div>
  );
}

export default Register;
