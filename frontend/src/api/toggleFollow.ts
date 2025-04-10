// src/api/toggleFollow.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function toggleFollow(token: string, username: string): Promise<any> {
    const response = await fetch(baseUrl+`api/profile/${username}/follow`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors du follow/unfollow");
    }
    return data;
  }
  