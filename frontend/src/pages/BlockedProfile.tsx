// src/pages/BlockedUsers.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

interface BlockedProfile {
  username: string;
  profilePicture: string;
}

const BlockedProfile: React.FC = () => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Fonction pour récupérer la liste des utilisateurs bloqués
  const fetchBlockedUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    try {
      const response = await fetch("http://localhost:8080/api/profile/blocked", {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des utilisateurs bloqués");
      }
      const data = await response.json();
      // On attend un tableau d'objets avec username et profilePicture
      setBlockedUsers(data.blockedUsers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  // Fonction pour débloquer un utilisateur
  const handleUnblock = async (username: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    try {
      const response = await fetch(`http://localhost:8080/api/profile/${username}/block`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Erreur lors du débloquage");
      }
      // On peut mettre à jour l'état en supprimant l'utilisateur débloqué
      setBlockedUsers((prevUsers) =>
        prevUsers.filter((user) => user.username !== username)
      );
    } catch (error) {
      console.error("Erreur lors du débloquage", error);
    }
  };

  if (loading) {
    return <div className="text-center mt-4">Chargement...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <h1 className="text-2xl font-bold mt-4 mb-4 text-white">Utilisateurs bloqués</h1>
      {blockedUsers.length === 0 ? (
        <p className=" text-white">Aucun utilisateur bloqué.</p>
      ) : (
        <ul>
          {blockedUsers.map((user, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-2 border-b border-gray-300"
            >
              <div className="flex items-center gap-4">
                <img
                  src={user.profilePicture}
                  alt={user.username}
                  className="w-10 h-10 rounded-full"
                />
                <span className=" text-white">{user.username}</span>
              </div>
              <Button
                text="Débloquer"
                onClick={() => handleUnblock(user.username)}
                moreClasses="bg-green-500 text-white px-4 py-2 rounded"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BlockedProfile;
