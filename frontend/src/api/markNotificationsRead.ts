// src/api/markNotificationsRead.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function markNotificationsRead(token: string): Promise<void> {
    const response = await fetch(baseUrl+"api/notifications/read", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de la mise à jour des notifications");
    }
  }
  