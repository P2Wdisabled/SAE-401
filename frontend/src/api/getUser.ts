// src/api/getUser.ts
export async function getUser(token: string, id: string): Promise<any> {
    const response = await fetch(`http://localhost:8080/users/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Erreur lors de la récupération de l'utilisateur");
    }
    return await response.json();
  }
  