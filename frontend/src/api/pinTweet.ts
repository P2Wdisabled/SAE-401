// src/api/pinTweet.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function pinTweet(token: string, username: string, tweetId: number): Promise<any> {
    const response = await fetch(baseUrl+`api/profile/${username}/pin/${tweetId}`, {
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
  