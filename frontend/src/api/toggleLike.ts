export async function toggleLike(token: string, tweetId: number): Promise<{ liked: boolean, likeCount: number }> {
    const response = await fetch(`http://localhost:8080/api/posts/${tweetId}/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors du toggle like");
    }
    return { liked: data.liked, likeCount: data.likeCount };
  }
  