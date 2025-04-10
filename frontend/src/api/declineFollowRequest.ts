// src/api/declineFollowRequest.ts

const baseUrl = import.meta.env.VITE_API_URL;
export async function declineFollowRequest(token: string, followerUsername: string): Promise<any> {
    const response = await fetch(
      baseUrl+`api/profile/pending/${followerUsername}/decline`,
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
  