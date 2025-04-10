// src/api/getPendingRequests.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function getPendingRequests(token: string): Promise<any[]> {
    const response = await fetch(baseUrl+"api/profile/pending", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    return data.pendingFollowRequests || [];
  }
  