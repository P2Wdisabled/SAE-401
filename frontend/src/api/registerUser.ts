// src/api/registerUser.ts
export type RegisterPayload = {
    username: string;
    email: string;
    password: string;
  };
  
  export async function registerUser(payload: RegisterPayload): Promise<Response> {
    const response = await fetch("http://localhost:8080/register", {
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
  