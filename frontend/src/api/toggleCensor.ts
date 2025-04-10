// src/api/toggleCensor.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function toggleCensor(token: string, postId: number): Promise<boolean> {
    const response = await fetch(baseUrl+`admin/posts/${postId}/toggle-censor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de la censure");
    }
    // On suppose que l'API renvoie l'état de censure dans data.censored
    return data.censored;
  }
  