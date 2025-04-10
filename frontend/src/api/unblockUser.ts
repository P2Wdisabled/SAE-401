// src/api/unblockUser.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function unblockUser(token: string, username: string): Promise<void> {
    const response = await fetch(baseUrl+`api/profile/${username}/block`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors du débloquage");
    }
  }
  