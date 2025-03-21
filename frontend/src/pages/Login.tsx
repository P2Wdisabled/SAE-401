import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormInput from "../ui/FormInput";
import useCheckToken from "../components/useCheckToken"; // Adapté selon votre arborescence

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  // Gère la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validation côté client
    if (!isEmailValid(email) || !isPasswordValid(password)) {
      setError("Email ou mot de passe incorrect");
      return;
    }

    const payload = { email, password };

    try {
      const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(response)

      if (response.ok) {
        const data = await response.json();
        // Stocker le token JWT dans le localStorage
        localStorage.setItem("token", data.token);
        navigate("/");
      } else {
        setError("Email ou mot de passe incorrect");
      }
    } catch (error) {
      console.error("Erreur lors de la requête:", error);
      setError("Erreur lors de la requête, veuillez réessayer plus tard.");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <div className="min-h-screen bg-[#17202A] text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8 max-w-xl">
        Pour Commencer, entrez votre numéro de téléphone, votre adresse email ou votre nom d’utilisateur
      </h1>

      <form className="w-full max-w-sm flex flex-col gap-4 mb-8" onSubmit={handleSubmit}>
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

        {/* Affichage du message d'erreur en cas d'informations erronées */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

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
            Se connecter
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;
