export async function replyTweet(
    token: string,
    tweetId: number,
    payload: { content: string, media: string[] }
  ): Promise<any> {
    const response = await fetch(`http://localhost:8080/api/posts/${tweetId}/reply`, {
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
  