// src/pages/CensorDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

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

  const fetchPosts = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    let url = `http://localhost:8080/admin/posts`;
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      }
    })
      .then(res =>
        res.json().then((data) => {
          if (!res.ok) {
            throw new Error(data.error || "Erreur lors de la récupération des posts");
          }
          return data;
        })
      )
      .then(data => {
        setPosts(data.posts);
        setError('');
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPosts();
  }, [search]);

  const toggleCensor = async (postId: number) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:8080/admin/posts/${postId}/toggle-censor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        }
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Erreur lors de la censure");
        return;
      }
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, censored: data.censored } : post
        )
      );
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la censure");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl text-white mb-4">Dashboard Admin - Gestion des contenus</h2>
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
                <Button
                  text={post.censored ? "Décensurer" : "Censurer"}
                  onClick={() => toggleCensor(post.id)}
                  moreClasses="bg-red-500 text-white px-3 py-1 rounded"
                />
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
