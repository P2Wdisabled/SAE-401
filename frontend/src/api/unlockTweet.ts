const baseUrl = import.meta.env.VITE_API_URL;
export async function unlockTweet(token: string, tweetId: number): Promise<void> {
    const response = await fetch(baseUrl+`api/posts/${tweetId}/unlock`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors du déverrouillage");
    }
  }
  