// src/api/loginUser.ts
const baseUrl = import.meta.env.VITE_API_URL;

export type LoginPayload = {
    email: string;
    password: string;
  };
  
  export async function loginUser(payload: LoginPayload): Promise<{ token: string }> {
    const response = await fetch(baseUrl+"login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Email ou mot de passe incorrect");
    }
    return data;
  }
  