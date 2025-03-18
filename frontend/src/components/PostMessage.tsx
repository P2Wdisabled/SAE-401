// src/components/PostMessage.tsx (ou .ts si c'est juste une fonction utilitaire)
import postsData from "../data/posts.json";

// Type minimaliste pour un Post
type Post = {
  id: number;
  author: string;
  content: string;
  timestamp: string;
};

// Fonction utilitaire pour ajouter un nouveau post dans le tableau
export function addNewPost(content: string) {
  // On génère un nouvel ID. Dans un vrai projet, un backend le ferait, 
  // ou on utiliserait un package comme uuid.
  const newId = postsData.length ? postsData[postsData.length - 1].id + 1 : 1;

  const newPost: Post = {
    id: newId,
    author: "Louis", // ou un pseudo, un user récupéré quelque part
    content: content,
    timestamp: new Date().toISOString()
  };
  postsData.push(newPost);
  console.log("Post ajouté :", newPost);
  console.log("postsData :", postsData);
  return newPost;
}
