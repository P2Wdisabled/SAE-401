// src/pages/Hashtag.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Tweet from "../ui/tweet";
import { getHashtagPosts } from "../api/getHashtagPosts";

const Hashtag: React.FC = () => {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    setLoading(true);
    getHashtagPosts(token, tag || "")
      .then((data) => {
        setPosts(data.posts);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tag, navigate]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl text-white mb-4">Hashtag : #{tag}</h2>
      {loading && <p className="text-white">Chargement...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {posts.length === 0 && !loading ? (
        <p className="text-white">Aucun post trouvé pour ce hashtag.</p>
      ) : (
        posts.map((post, index) => (
          <Tweet
            key={post.id || index}
            tweetId={post.id}
            author={post.username}
            content={post.content}
            profilePicture={post.profilePicture || "default-profile.png"}
            initialLikeCount={post.likeCount || 0}
            initialLiked={post.liked || false}
            initialRetweetCount={post.retweetCount || 0}
            media={post.media}
            replies={post.replies}
            isOwner={post.editable}
            censored={post.censored}
          />
        ))
      )}
    </div>
  );
};

export default Hashtag;
