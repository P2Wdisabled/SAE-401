// src/components/TweetList.tsx
import React, { useState, useEffect } from "react";
import Tweet from "../ui/tweet";

type TweetListProps = {
  activeTab: "pourVous" | "abonnements";
};

function TweetList({ activeTab }: TweetListProps) {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("http://localhost:8080/posts?page=0")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des posts");
        }
        return response.json();
      })
      .then((data) => {
        // On suppose que la réponse contient un tableau "posts"
        setPosts(data.posts);
      })
      .catch((err) => {
        console.error(err);
        setError("Erreur lors du chargement des posts.");
      });
  }, []);
  // Exemples de tweets différents selon l'onglet
  if (activeTab === "pourVous") {
    return (
      <main className="px-4 pb-16">
        {error && <p className="text-red-500">{error}</p>}
      {posts.map((post, index) => (
        <Tweet
          key={index}
          author={post.username ? post.username : "Unnamed"}
          content={post.content}
          avatarColor="bg-gray-400"
        />
      ))}
      </main>
    );
  } else {
    // Onglet "Abonnements"
    return (
      <main className="px-4 pb-16">
        <Tweet
          author="MonMeilleurAmi"
          content="Salut les amis, abonnez-vous pour plus de contenu exclusif !"
          avatarColor="bg-blue-500"
        />
        <Tweet
          author="DevReact"
          content="Voici des astuces pour coder plus vite en React !"
          avatarColor="bg-green-500"
        />
      </main>
    );
  }
}

export default TweetList;
