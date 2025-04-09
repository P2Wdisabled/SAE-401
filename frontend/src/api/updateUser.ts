// src/api/updateUser.ts
export async function updateUser(
    token: string,
    id: string,
    payload: { username: string; email: string }
  ): Promise<any> {
    const response = await fetch(`http://localhost:8080/users/${id}`, {
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
  