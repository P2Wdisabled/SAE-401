// src/api/getPendingRequests.ts
export async function getPendingRequests(token: string): Promise<any[]> {
    const response = await fetch("http://localhost:8080/api/profile/pending", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    return data.pendingFollowRequests || [];
  }
  