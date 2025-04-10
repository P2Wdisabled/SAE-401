// src/api/uploadFile.ts
const baseUrl = import.meta.env.VITE_API_URL;

export async function uploadFile(file: File, token: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(baseUrl+"api/upload", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Erreur lors de l'upload");
    }
    const data = await response.json();
    return data.url;
  }
  