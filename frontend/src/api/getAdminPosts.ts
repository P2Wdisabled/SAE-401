// src/api/getAdminPosts.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function getAdminPosts(token: string, search: string): Promise<any> {
    let url = baseUrl+`admin/posts`;
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de la récupération des posts");
    }
    return data;
  }
  