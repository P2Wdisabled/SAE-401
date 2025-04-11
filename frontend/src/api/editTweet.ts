export async function editTweet(
    token: string,
    tweetId: number,
    payload: { content: string, media: string[] }
  ): Promise<any> {
    const response = await fetch(`http://localhost:8080/api/posts/${tweetId}`, {
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
  