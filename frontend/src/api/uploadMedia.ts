// src/api/uploadMedia.ts
export async function uploadMediaFile(file: File, token: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("http://localhost:8080/api/upload", {
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
  