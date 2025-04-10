// src/api/registerUser.ts
const baseUrl = import.meta.env.VITE_API_URL;

export type RegisterPayload = {
    username: string;
    email: string;
    password: string;
  };
  
  export async function registerUser(payload: RegisterPayload): Promise<Response> {
    const response = await fetch(baseUrl+"register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (response.status !== 201) {
      const data = await response.json();
      throw new Error(data.error || "Erreur lors de l'inscription");
    }
    
    return response;
  }
  