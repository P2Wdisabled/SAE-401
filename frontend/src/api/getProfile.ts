// src/api/getProfile.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function getProfile(username: string, token: string): Promise<any> {
    const response = await fetch(baseUrl+`profile/${username}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors du chargement du profil");
    }
    return data;
  }
  