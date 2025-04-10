// src/api/createPost.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function createPost(
    content: string,
    media: string[],
    locked: boolean,
    token: string
  ): Promise<any> {
    const response = await fetch(baseUrl+"api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify({ content, media, locked }),
    });
    const data = await response.json();
    if (!response.ok) {
      if (data.errors) {
        const allErrors = Object.values(data.errors).join(" ");
        throw new Error(allErrors);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Une erreur inconnue est survenue.");
      }
    }
    return data;
  }
  