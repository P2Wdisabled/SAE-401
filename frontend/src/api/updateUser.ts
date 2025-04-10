// src/api/updateUser.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function updateUser(
    token: string,
    id: string,
    payload: { username: string; email: string }
  ): Promise<any> {
    const response = await fetch(baseUrl+`users/${id}`, {
      method: "PUT", // ou "PATCH" selon votre API
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Erreur lors de la mise à jour de l'utilisateur");
    }
    return await response.json();
  }
  