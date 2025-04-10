// src/api/getLimitComments.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function getLimitComments(token: string): Promise<boolean> {
    const response = await fetch(baseUrl+"api/profile/limit", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    // L'endpoint renvoie { "limit": [ { "limited": boolean } ] }
    if (data.limit && data.limit[0]) {
      return data.limit[0].limited;
    }
    throw new Error("Erreur lors de la récupération de l'option de limitation des commentaires");
  }
  