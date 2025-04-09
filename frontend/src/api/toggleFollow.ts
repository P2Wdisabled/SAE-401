// src/api/toggleFollow.ts
export async function toggleFollow(token: string, username: string): Promise<any> {
    const response = await fetch(`http://localhost:8080/api/profile/${username}/follow`, {
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
  