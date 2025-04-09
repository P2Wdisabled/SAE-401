// src/api/getProfileEdit.ts
export async function getProfileEdit(token: string): Promise<any> {
    const response = await fetch("http://localhost:8080/api/profile/edit", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Erreur lors du chargement des informations du profil");
    }
    return await response.json();
  }
  