// src/components/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../ui/FormInput";
import Button from "../ui/Button";
import { useCheckToken } from "../components/Checker";
import { isEmailValid } from "../utils/isEmailValid";
import { isPasswordValid } from "../utils/isPasswordValid";
import { loginUser } from "../api/loginUser";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  useCheckToken();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!isEmailValid(email) || !isPasswordValid(password)) {
      setError("Incorrect email or password");
      return;
    }

    const payload = { email, password };

    try {
      const data = await loginUser(payload);
      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (err: any) {
      console.error("Error during request:", err);
      setError(err.message || "Incorrect email or password");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <div className="min-h-screen bg-[#17202A] text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8 max-w-xl">
        To begin, enter your phone number, email address, or username
      </h1>

      <form className="w-full max-w-sm flex flex-col gap-4 mb-8" onSubmit={handleSubmit}>
        <FormInput
          label="Email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />

        <FormInput
          label="Password"
          type="password"
          value={password}
          onChange={handlePasswordChange}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex w-full max-w-sm justify-between">
          <Button 
            page="/landing" 
            text="Back" 
            variant="outline"
            size="small"
          />
          <Button 
            text="Sign In" 
            buttonType="submit" 
            variant="white" 
            size="small"
          />
        </div>
      </form>
    </div>
  );
}

export default Login;
