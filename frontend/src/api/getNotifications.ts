// src/api/getNotifications.ts
export async function getNotifications(token: string): Promise<any[]> {
    const response = await fetch("http://localhost:8080/api/notifications", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    return data.notifications || [];
  }
  