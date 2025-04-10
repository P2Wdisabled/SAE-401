// src/api/getBlockedUsers.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function getBlockedUsers(token: string): Promise<any[]> {
    const response = await fetch(baseUrl+"api/profile/blocked", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors du chargement des utilisateurs bloqués");
    }
    // On suppose que l'API renvoie un tableau dans data.blockedUsers
    return data.blockedUsers;
  }
  