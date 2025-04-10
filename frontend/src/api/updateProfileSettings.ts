// src/api/updateProfileSettings.ts
const baseUrl = import.meta.env.VITE_API_URL;

type SettingsData = {
    readOnly: boolean;
    private: boolean;
  };
  
  export async function updateProfileSettings(token: string, settings: SettingsData): Promise<any> {
    const response = await fetch(baseUrl+"api/profile/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify(settings),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de la mise à jour des paramètres");
    }
    return data;
  }
  