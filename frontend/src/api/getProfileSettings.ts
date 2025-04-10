// src/api/getProfileSettings.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function getProfileSettings(token: string): Promise<{ readOnly: boolean; private: boolean }> {
    const response = await fetch(baseUrl+"api/profile/settings", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors du chargement des paramètres");
    }
    return data;
  }
  