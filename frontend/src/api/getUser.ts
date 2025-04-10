// src/api/getUser.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function getUser(token: string, id: string): Promise<any> {
    const response = await fetch(baseUrl+`users/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Erreur lors de la récupération de l'utilisateur");
    }
    return await response.json();
  }
  