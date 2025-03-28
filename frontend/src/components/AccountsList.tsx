// src/components/AccountsList.tsx
import React, { useState, useEffect } from "react";
import Profile from "../ui/Profile";
import Button from "../ui/Button";

function AccountsList() {
  const [accounts, setAccounts] = useState<any[]>([]);
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
    fetch(`http://localhost:8080/users/Accounts?page=${pageNum}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des comptes");
        }
        return response.json();
      })
      .then((data) => {
        const newAccounts = data.users;
        if (pageNum === 0) {
          setAccounts(newAccounts);
        } else {
          setAccounts((prev) => [...prev, ...newAccounts]);
        }
        if (newAccounts.length < 50) {
          setHasMore(false);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Erreur lors du chargement des comptes.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Chargement initial
  useEffect(() => {
    fetchAccounts(0);
  }, []);

  // Pagination lors du scroll
  useEffect(() => {
    if (page > 0) {
      fetchAccounts(page);
    }
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolledFromTop =
        window.innerHeight + document.documentElement.scrollTop;
      const totalHeight = document.documentElement.offsetHeight;
      if (scrolledFromTop >= totalHeight - 10 && hasMore && !loading) {
        setPage((prevPage) => prevPage + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading]);

  const toggleBlock = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:8080/admin/users/${id}/toggle-block`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      // Mise à jour locale de l'état de blocage pour le compte concerné
      setAccounts((prevAccounts) =>
        prevAccounts.map((account) =>
          account.id === id ? { ...account, blocked: data.blocked } : account
        )
      );
    } catch (error) {
      console.error("Erreur lors du blocage/déblocage", error);
    }
  };

  return (
    <main className="px-4 pb-16">
      {error && <p className="text-red-500">{error}</p>}
      {accounts.map((account) => (
        <div key={account.id} className="flex justify-between items-center my-4 p-2 border-b border-gray-300">
          <div>
            <p className="font-bold">{account.username}</p>
            <p className="text-sm text-gray-600">{account.email}</p>
          </div>
          <div>
            <Button 
              text={account.blocked ? "Débloquer" : "Bloquer"} 
              onClick={() => toggleBlock(account.id)}
              moreClasses="bg-red-500 text-white px-4 py-2 rounded"
            />
          </div>
        </div>
      ))}
      {loading && <p>Chargement...</p>}
    </main>
  );
}

export default AccountsList;
