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

  // Function to load posts via the API
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

  // Toggle the censorship of a post
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
      alert("Error toggling censorship");
    }
  };

  // Delete a post
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
      alert("Error deleting the post");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl text-white mb-4">
        Admin Dashboard - Content Management
      </h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 rounded w-full"
        />
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p className="text-white">Loading...</p>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="p-4 border rounded bg-gray-800 text-white">
              <div className="flex justify-between items-center">
                <p className="font-bold">{post.username}</p>
                <div className="flex space-x-2">
                  <Button
                    text={post.censored ? "Uncensor" : "Censor"}
                    onClick={() => toggleCensor(post.id)}
                    variant="danger"
                    size="small"
                  />
                  <Button
                    text="Delete"
                    onClick={() => deletePost(post.id)}
                    variant="secondary"
                    size="small"
                  />
                </div>
              </div>
              <div className="mt-2">
                {post.censored ? (
                  <p className="italic">
                    This message violates the platform's terms of use
                  </p>
                ) : (
                  <p>{post.content}</p>
                )}
              </div>
              {!post.censored && (
                <div className="mt-2 flex space-x-4">
                  <span>Likes: {post.likeCount}</span>
                  {post.replies && post.replies.length > 0 && (
                    <span>Replies: {post.replies.length}</span>
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
