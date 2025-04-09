// src/api/declineFollowRequest.ts
export async function declineFollowRequest(token: string, followerUsername: string): Promise<any> {
    const response = await fetch(
      `http://localhost:8080/api/profile/pending/${followerUsername}/decline`,
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors du refus de la demande");
    }
    return data;
  }
  