// src/api/toggleCommentsLimit.ts
export async function toggleCommentsLimit(token: string, currentLimit: boolean): Promise<any> {
    const response = await fetch(`http://localhost:8080/api/profile/toggle-comments-limit`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        limit: !currentLimit,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de la mise à jour de l'option de commentaire");
    }
    return data;
  }
  