// src/components/TweetList.tsx
import React, { useState, useEffect } from "react";
import Profile from "../ui/Profile";


function AccountsList() {
  const [Accounts, setAccounts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchAccounts = (pageNum: number) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Utilisateur non authentifié.");
      return;
    }
    fetch(`http://localhost:8080/users/Accounts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des Accounts");
        }
        return response.json();
      })
      .then((data) => {
        const newAccounts = data.users;
        // Pour la page initiale, on remplace la liste afin d'éviter les doublons
        if (pageNum === 0) {
          setAccounts(newAccounts);
        } else {
          setAccounts((prevAccounts) => [...prevAccounts, ...newAccounts]);
        }
        if (newAccounts.length < 50) {
          setHasMore(false);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Erreur lors du chargement des Accounts.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Chargement initial uniquement au montage (page 0)
  useEffect(() => {
    fetchAccounts(0);
  }, []);

  // Chargement des pages supérieures lors du scroll
  useEffect(() => {
    if (page > 0) {
      fetchAccounts(page);
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

    return (
      <main className="px-4 pb-16">
        {error && <p className="text-red-500">{error}</p>}
        {Accounts.map((post, index) => (
          <Profile
            key={index}
            id={post.id}
            username={post.username ? post.username : "Unnamed"}
            email={post.email}
            avatarColor="bg-gray-400"
          />
        ))}
        {loading && <p>Chargement...</p>}
      </main>
    );
}

export default AccountsList;
