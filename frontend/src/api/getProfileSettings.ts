// src/api/getProfileSettings.ts
export async function getProfileSettings(token: string): Promise<{ readOnly: boolean; private: boolean }> {
    const response = await fetch("http://localhost:8080/api/profile/settings", {
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
  