// src/api/deletePost.ts
export async function deletePost(token: string, postId: number): Promise<void> {
    const response = await fetch(`http://localhost:8080/admin/posts/${postId}`, {
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
  