// src/api/getNotifications.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function getNotifications(token: string): Promise<any[]> {
    const response = await fetch(baseUrl+"api/notifications", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    return data.notifications || [];
  }
  