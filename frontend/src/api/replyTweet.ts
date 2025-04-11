const baseUrl = import.meta.env.VITE_API_URL;
export async function replyTweet(
    token: string,
    tweetId: number,
    payload: { content: string, media: string[] }
  ): Promise<any> {
    const response = await fetch(baseUrl+`api/posts/${tweetId}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de l'envoi de la réponse");
    }
    return data;
  }
  