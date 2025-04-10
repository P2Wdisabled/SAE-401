// src/api/getHashtagPosts.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function getHashtagPosts(token: string, tag: string): Promise<any> {
    const response = await fetch(baseUrl+`api/hashtag/${tag}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de la récupération des posts pour ce hashtag");
    }
    return data;
  }
  