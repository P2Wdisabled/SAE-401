// src/api/updateProfile.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function updateProfile(
    token: string,
    payload: {
      bio: string;
      profilePicture: string;
      banner: string;
      location: string;
      website: string;
    }
  ): Promise<any> {
    const response = await fetch(baseUrl+"api/profile/edit", {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Erreur lors de la mise à jour.");
    }
    return await response.json();
  }
  