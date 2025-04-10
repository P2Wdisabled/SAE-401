// src/api/getProfileEdit.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function getProfileEdit(token: string): Promise<any> {
    const response = await fetch(baseUrl+"api/profile/edit", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Erreur lors du chargement des informations du profil");
    }
    return await response.json();
  }
  