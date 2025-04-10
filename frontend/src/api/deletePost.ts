// src/api/deletePost.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function deletePost(token: string, postId: number): Promise<void> {
    const response = await fetch(baseUrl`admin/posts/${postId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de la suppression du post");
    }
  }
  