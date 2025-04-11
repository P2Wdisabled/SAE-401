import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Tweet from "../ui/tweet";
import Button from "../ui/Button";
import { getPosts } from "../api/getPosts";

type TweetListProps = {
  activeTab: "pourVous" | "abonnements";
};

// Generic debounce hook
function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

function TweetList({ activeTab }: TweetListProps) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const refreshInterval = 5; // seconds

  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 500);
  
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const debouncedFilterUser = useDebounce(filterUser, 500);

  // Generic function to fetch posts (based on the page)
  const fetchPosts = async (pageNum: number) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User not authenticated.");
      navigate("/landing");
      return;
    }
    try {
      const data = await getPosts(
        token,
        pageNum,
        activeTab,
        debouncedSearchText,
        filterDate,
        filterType,
        debouncedFilterUser
      );
      setError("");
      const newPosts = data.posts;
      if (pageNum === 0) setPosts(newPosts);
      else setPosts((prevPosts) => [...prevPosts, ...newPosts]);
      if (newPosts.length < 50) setHasMore(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error while loading posts.");
    } finally {
      setLoading(false);
    }
  };

  // Refreshes posts (page 0) with a minimum delay for user experience
  const refreshPosts = async () => {
    const startTime = Date.now();
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User not authenticated.");
      navigate("/landing");
      setLoading(false);
      return;
    }
    try {
      const data = await getPosts(
        token,
        0,
        activeTab,
        debouncedSearchText,
        filterDate,
        filterType,
        debouncedFilterUser
      );
      setError("");
      const newPosts = data.posts;
      setPosts(newPosts);
      if (newPosts.length < 50) setHasMore(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error while refreshing posts.");
    } finally {
      const elapsed = Date.now() - startTime;
      const minDuration = 2000;
      const delay = Math.max(0, minDuration - elapsed);
      setTimeout(() => setLoading(false), delay);
    }
  };

  // Load posts on mount and when filters change
  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    fetchPosts(0);
  }, [activeTab, debouncedSearchText, filterDate, filterType, debouncedFilterUser]);

  // Load the next page if necessary
  useEffect(() => {
    if (page > 0) fetchPosts(page);
  }, [page]);

  // Trigger infinite scrolling
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

  // Auto-refresh management
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (autoRefreshEnabled) {
      interval = setInterval(() => refreshPosts(), refreshInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefreshEnabled, refreshInterval, activeTab, debouncedSearchText, filterDate, filterType, debouncedFilterUser]);

  const handleDelete = (tweetId: number) => {
    setPosts((prev) => prev.filter((tweet) => tweet.id !== tweetId));
  };

  if (loading) {
    return <div className="text-center mt-4">Loading...</div>;
  }
  if (!error && posts.length === 0) {
    return <div className="text-center mt-4">No tweets to display.</div>;
  }

  return (
    <main className="px-4 pb-16">
      <div className="absolute flex justify-end my-4 top-1/6 right-4">
        <Button page="/admin" text="admin" variant="outline" />
      </div>
      
      <div className="flex flex-col gap-4 my-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="p-2 rounded w-full text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="p-2 rounded text-white fill-white"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 rounded text-white"
          >
            <option value="">All types</option>
            <option value="text">Text</option>
            <option value="media">Media</option>
          </select>
          <input
            type="text"
            placeholder="User"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="p-2 rounded text-white"
          />
        </div>
      </div>
      
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
          variant="floating"
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
          initialRetweetCount={post.retweetCount || 0}
          initialLiked={post.liked || false}
          media={post.media}
          replies={post.replies}
          isOwner={post.editable}
          censored={post.censored}
          locked={post.locked}
          onDelete={() => handleDelete(post.id)}
        />
      ))}
      {loading && <p>Loading...</p>}
    </main>
  );
}

export default TweetList;
