const baseUrl = import.meta.env.VITE_API_URL;
export async function editTweet(
    token: string,
    tweetId: number,
    payload: { content: string, media: string[] }
  ): Promise<any> {
    const response = await fetch(baseUrl+`api/posts/${tweetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de la mise à jour du tweet");
    }
    return data.post;
  }
  