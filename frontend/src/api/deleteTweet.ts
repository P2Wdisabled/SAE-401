export async function deleteTweet(token: string, tweetId: number): Promise<void> {
    const response = await fetch(`http://localhost:8080/api/posts/${tweetId}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de la suppression du tweet");
    }
  }
  