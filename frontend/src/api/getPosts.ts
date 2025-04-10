// src/api/getPosts.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function getPosts(
    token: string,
    page: number,
    activeTab: "pourVous" | "abonnements",
    searchText: string,
    filterDate: string,
    filterType: string,
    filterUser: string
  ): Promise<any> {
    let url =
      activeTab === "abonnements"
        ? baseUrl+`api/posts?filter=following&page=${page}`
        : baseUrl+`api/posts?page=${page}`;
  
    if (searchText) url += `&search=${encodeURIComponent(searchText)}`;
    if (filterDate) url += `&date=${encodeURIComponent(filterDate)}`;
    if (filterType) url += `&type=${encodeURIComponent(filterType)}`;
    if (filterUser) url += `&user=${encodeURIComponent(filterUser)}`;
  
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      // La gestion de 401 ou 403 pourra être faite dans le composant
      throw new Error(data.error || "Erreur lors de la récupération des posts");
    }
    return data;
  }
  