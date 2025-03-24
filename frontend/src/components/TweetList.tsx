// src/components/TweetList.tsx
import React, { useState, useEffect } from "react";
import Tweet from "../ui/tweet";

type TweetListProps = {
  activeTab: "pourVous" | "abonnements";
};

function TweetList({ activeTab }: TweetListProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchPosts = (pageNum: number) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Utilisateur non authentifié.");
      return;
    }
    fetch(`http://localhost:8080/api/posts?page=${pageNum}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des posts");
        }
        return response.json();
      })
      .then((data) => {
        const newPosts = data.posts;
        // Pour la page initiale, on remplace la liste afin d'éviter les doublons
        if (pageNum === 0) {
          setPosts(newPosts);
        } else {
          setPosts((prevPosts) => [...prevPosts, ...newPosts]);
        }
        if (newPosts.length < 50) {
          setHasMore(false);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Erreur lors du chargement des posts.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Chargement initial uniquement au montage (page 0)
  useEffect(() => {
    fetchPosts(0);
  }, []);

  // Chargement des pages supérieures lors du scroll
  useEffect(() => {
    if (page > 0) {
      fetchPosts(page);
    }
  }, [page]);

  // Détecter le scroll vers le bas
  useEffect(() => {
    const handleScroll = () => {
      const scrolledFromTop =
        window.innerHeight + document.documentElement.scrollTop;
      const totalHeight = document.documentElement.offsetHeight;
      // Chargement déclenché à 10px du bas
      if (scrolledFromTop >= totalHeight - 10 && hasMore && !loading) {
        setPage((prevPage) => prevPage + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading]);

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
        {loading && <p>Chargement...</p>}
      </main>
    );
  }// else {
  //   // Onglet "Abonnements"
  //   return (
  //     <main className="px-4 pb-16">
  //       <Tweet
  //         author="MonMeilleurAmi"
  //         content="Salut les amis, abonnez-vous pour plus de contenu exclusif !"
  //         avatarColor="bg-blue-500"
  //       />
  //       <Tweet
  //         author="DevReact"
  //         content="Voici des astuces pour coder plus vite en React !"
  //         avatarColor="bg-green-500"
  //       />
  //     </main>
  //   );
  // }
}

export default TweetList;
