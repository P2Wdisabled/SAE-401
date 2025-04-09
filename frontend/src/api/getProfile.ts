// src/api/getProfile.ts
export async function getProfile(username: string, token: string): Promise<any> {
    const response = await fetch(`http://localhost:8080/profile/${username}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors du chargement du profil");
    }
    return data;
  }
  