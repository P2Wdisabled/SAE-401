// src/api/getHashtagPosts.ts
export async function getHashtagPosts(token: string, tag: string): Promise<any> {
    const response = await fetch(`http://localhost:8080/api/hashtag/${tag}`, {
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
  