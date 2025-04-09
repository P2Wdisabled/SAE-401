// src/api/markNotificationsRead.ts
export async function markNotificationsRead(token: string): Promise<void> {
    const response = await fetch("http://localhost:8080/api/notifications/read", {
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
  