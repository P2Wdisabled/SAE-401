// src/components/TweetList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Tweet from "../ui/tweet";
import Button from "../ui/Button";

type TweetListProps = {
  activeTab: "pourVous" | "abonnements";
};

function TweetList({ activeTab }: TweetListProps) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const refreshInterval = 30; // secondes

  // Réinitialiser posts, page et hasMore quand activeTab change
  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    fetchPosts(0);
  }, [activeTab]);

  const fetchPosts = (pageNum: number) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Utilisateur non authentifié.");
      navigate("/landing");
      return;
    }
    const url =
      activeTab === "abonnements"
        ? `http://localhost:8080/api/posts?filter=following&page=${pageNum}`
        : `http://localhost:8080/api/posts?page=${pageNum}`;

    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401) {
            navigate("/landing");
          } else if (response.status === 403) {
            navigate("/");
          }
          throw new Error("Erreur lors de la récupération des posts");
        }
        return response.json();
      })
      .then((data) => {
        const newPosts = data.posts;
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

  const refreshPosts = () => {
    const startTime = Date.now();
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Utilisateur non authentifié.");
      navigate("/landing");
      setLoading(false);
      return;
    }
    const url =
      activeTab === "abonnements"
        ? `http://localhost:8080/api/posts?filter=following&page=0`
        : `http://localhost:8080/api/posts?page=0`;

    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401) navigate("/landing");
          else if (response.status === 403) navigate("/");
          throw new Error("Erreur lors de la récupération des posts");
        }
        return response.json();
      })
      .then((data) => {
        const newPosts = data.posts;
        setPosts(newPosts);
        if (newPosts.length < 50) {
          setHasMore(false);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Erreur lors du rafraîchissement des posts.");
      })
      .finally(() => {
        const elapsed = Date.now() - startTime;
        const minDuration = 2000;
        const delay = Math.max(0, minDuration - elapsed);
        setTimeout(() => {
          setLoading(false);
        }, delay);
      });
  };

  useEffect(() => {
    fetchPosts(0);
  }, []);

  useEffect(() => {
    if (page > 0) {
      fetchPosts(page);
    }
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolledFromTop = window.innerHeight + document.documentElement.scrollTop;
      const totalHeight = document.documentElement.offsetHeight;
      if (scrolledFromTop >= totalHeight - 10 && hasMore && !loading) {
        setPage((prevPage) => prevPage + 1);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (autoRefreshEnabled) {
      interval = setInterval(() => {
        refreshPosts();
      }, refreshInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefreshEnabled, refreshInterval, activeTab]);

  const handleDelete = (tweetId: number) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== tweetId));
  };

  return (
    <main className="px-4 pb-16">
      <div id="RefreshButton" className="flex justify-between items-center my-4">
        <Button
          text=""
          object={
            <svg
              className={loading ? "animate-spin" : ""}
              width="36"
              height="36"
              viewBox="0 0 46 46"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M40.1691 7.74453C35.9645 3.00078 29.8461 0 23 0C10.2961 0 0 10.2961 0 23H5.75C5.75 13.4676 13.4676 5.75 23 5.75C28.2559 5.75 32.9188 8.13086 36.0723 11.8414L30.6637 17.25H46V1.91367L40.1691 7.74453ZM23 40.25C17.7441 40.25 13.0812 37.8691 9.92773 34.1586L15.3363 28.75H0V44.0863L5.83086 38.2555C10.0355 42.9992 16.1629 46 23 46C35.7039 46 46 35.7039 46 23H40.25C40.25 32.5324 32.5324 40.25 23 40.25Z"
                fill="white"
              />
            </svg>
          }
          moreClasses="bg-[#1DA1F2] flex items-center justify-center text-white w-15 h-15 px-4 py-2 rounded hover:bg-[#1A91DA] transition absolute bottom-1/12 left-1/2 right-1/2"
          onClick={refreshPosts}
        />
        <div className="flex items-center">
          <label className="text-white mr-2" htmlFor="autoRefresh">
            Auto-refresh
          </label>
          <input
            id="autoRefresh"
            type="checkbox"
            checked={autoRefreshEnabled}
            onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
          />
        </div>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {posts.map((post, index) => (
        <Tweet
          key={post.id || index}
          tweetId={post.id}
          author={post.username ? post.username : "Unnamed"}
          content={post.content}
          profilePicture={post.profilePicture || "default-profile.png"}
          initialLikeCount={post.likeCount || 0}
          initialLiked={post.liked || false}
          media={post.media}
          replies={post.replies} // Transmission des réponses
          isOwner={post.editable}
          onDelete={() => handleDelete(post.id)}
        />
      ))}
      {loading && <p>Chargement...</p>}
    </main>
  );
}

export default TweetList;
