const baseUrl = import.meta.env.VITE_API_URL;
export async function retweet(token: string, tweetId: number, comment?: string): Promise<{ retweetCount: number }> {
    const response = await fetch(baseUrl+`api/posts/${tweetId}/retweet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify({ comment }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors du retweet");
    }
    return { retweetCount: data.retweet?.retweetCount };
  }
  