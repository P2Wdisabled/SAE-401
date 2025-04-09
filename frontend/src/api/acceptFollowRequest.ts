// src/api/acceptFollowRequest.ts
export async function acceptFollowRequest(token: string, followerUsername: string): Promise<any> {
    const response = await fetch(
      `http://localhost:8080/api/profile/pending/${followerUsername}/accept`,
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
      throw new Error(data.error || "Erreur lors de l'acceptation de la demande");
    }
    return data;
  }
  