export async function lockTweet(token: string, tweetId: number): Promise<void> {
    const response = await fetch(`http://localhost:8080/api/posts/${tweetId}/lock`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors du verrouillage");
    }
  }
  