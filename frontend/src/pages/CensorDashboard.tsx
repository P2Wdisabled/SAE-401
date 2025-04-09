// src/pages/CensorDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { getAdminPosts } from '../api/getAdminPosts';
import { toggleCensor as apiToggleCensor } from '../api/toggleCensor';
import { deletePost as apiDeletePost } from '../api/deletePost';

type Post = {
  id: number;
  username: string;
  content: string;
  censored: boolean;
  likeCount: number;
  media?: string[];
  replies?: any[];
  retweets?: number;
};

const CensorDashboard: React.FC = () => { 
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // Fonction pour charger les posts via l'API
  const fetchPosts = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    getAdminPosts(token, search)
      .then((data) => {
        setPosts(data.posts);
        setError('');
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, [search, navigate]);

  // Bascule la censure d'un post
  const toggleCensor = async (postId: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    try {
      const censored = await apiToggleCensor(token, postId);
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, censored } : post
        )
      );
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la censure");
    }
  };

  // Supprime un post
  const deletePost = async (postId: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    try {
      await apiDeletePost(token, postId);
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression du post");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl text-white mb-4">
        Dashboard Admin - Gestion des contenus
      </h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 rounded w-full"
        />
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p className="text-white">Chargement...</p>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="p-4 border rounded bg-gray-800 text-white">
              <div className="flex justify-between items-center">
                <p className="font-bold">{post.username}</p>
                <div className="flex space-x-2">
                  <Button
                    text={post.censored ? "Décensurer" : "Censurer"}
                    onClick={() => toggleCensor(post.id)}
                    moreClasses="bg-red-500 text-white px-3 py-1 rounded"
                  />
                  <Button
                    text="Supprimer"
                    onClick={() => deletePost(post.id)}
                    moreClasses="bg-gray-700 text-white px-3 py-1 rounded"
                  />
                </div>
              </div>
              <div className="mt-2">
                {post.censored ? (
                  <p className="italic">
                    Ce message enfreint les conditions d’utilisation de la plateforme
                  </p>
                ) : (
                  <p>{post.content}</p>
                )}
              </div>
              {!post.censored && (
                <div className="mt-2 flex space-x-4">
                  <span>Likes: {post.likeCount}</span>
                  {post.replies && post.replies.length > 0 && (
                    <span>Réponses: {post.replies.length}</span>
                  )}
                </div>
              )}
              {post.retweets !== undefined && (
                <div className="mt-2">
                  <span>Retweets: {post.retweets}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CensorDashboard;
