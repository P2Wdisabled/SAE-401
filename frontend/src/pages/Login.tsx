// src/components/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../ui/FormInput";
import { useCheckToken } from "../components/Checker";
import Button from "../ui/Button";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  useCheckToken();

  const navigate = useNavigate();

  const isEmailValid = (email: string): boolean => {
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
  };

  const isPasswordValid = (password: string): boolean => {
    const minLength = 8;
    const hasDigit = /[0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[\W_]/.test(password);
    return password.length >= minLength && hasDigit && hasUpper && hasLower && hasSpecial;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!isEmailValid(email) || !isPasswordValid(password)) {
      setError("Email ou mot de passe incorrect");
      return;
    }

    const payload = { email, password };

    try {
      const response = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        navigate("/");
      } else {
        // Afficher l'erreur renvoyée par l'API
        setError(data.error || "Email ou mot de passe incorrect");
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

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex w-full max-w-sm justify-between">
          <Button 
            page="/landing" 
            text="Retour" 
            bg="bg-transparent" 
            moreClasses="px-4 py-2 border border-gray-500 rounded-full text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 active:bg-gray-600 transition"
          />
          <Button 
            text="Se connecter" 
            buttonType="submit" 
            bg="bg-white" 
            moreClasses="px-4 py-2 rounded-full text-black font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 active:bg-gray-300 transition"
          />
        </div>
      </form>
    </div>
  );
}

export default Login;
