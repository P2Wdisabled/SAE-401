// src/api/pinTweet.ts
export async function pinTweet(token: string, username: string, tweetId: number): Promise<any> {
    const response = await fetch(`http://localhost:8080/api/profile/${username}/pin/${tweetId}`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de l'épinglage du tweet");
    }
    return data;
  }
  