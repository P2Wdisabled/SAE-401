import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Tweet from "../ui/tweet";
import Button from "../ui/Button";

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [pinnedTweet, setPinnedTweet] = useState<any>(null);
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<boolean>(false);
  const [followError, setFollowError] = useState<string>("");
  const [blockError, setBlockError] = useState<string>("");
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showPendingPopup, setShowPendingPopup] = useState<boolean>(false);
  const [showNotificationsPopup, setShowNotificationsPopup] = useState<boolean>(false);

  const navigate = useNavigate();

  const fetchProfile = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    setLoading(true);
    fetch(`http://localhost:8080/profile/${username}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    })
      .then((res) =>
        res.json().then((data) => {
          if (!res.ok) {
            throw new Error(data.error || "Erreur lors du chargement du profil");
          }
          return data;
        })
      )
      .then((data) => {
        setFollowError("");
        setBlockError("");
        setProfile(data.profile);
        setPinnedTweet(data.pinnedTweet);
        setTweets(data.tweets);
        setFollowing(data.profile.followed);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [username, navigate]);

  const fetchPendingRequests = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:8080/api/profile/pending", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    })
      .then((res) => res.json())
      .then((data) => setPendingRequests(data.pendingFollowRequests || []))
      .catch((err) => console.error(err));
  }, []);

  const fetchNotifications = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:8080/api/notifications", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    })
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Si le profil appartient à l'utilisateur connecté, récupérer demandes pending et notifications
  useEffect(() => {
    if (profile && profile.editable) {
      fetchPendingRequests();
      fetchNotifications();
    }
  }, [profile, fetchPendingRequests, fetchNotifications]);

  // Calculer le nombre total d'éléments non lus : notifications non lues + nombre de demandes pending
  const unreadCount =
    notifications.filter((notif: any) => !notif.isRead).length +
    pendingRequests.length;

  // Lorsque le popup de notifications s'ouvre, marquer toutes les notifications comme lues
  useEffect(() => {
    if (showNotificationsPopup) {
      const token = localStorage.getItem("token");
      if (!token) return;
      fetch("http://localhost:8080/api/notifications/read", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
      })
        .then((res) => res.json())
        .then(() => fetchNotifications())
        .catch((err) => console.error(err));
    }
  }, [showNotificationsPopup, fetchNotifications]);

  const handleAcceptRequest = async (followerUsername: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `http://localhost:8080/api/profile/pending/${followerUsername}/accept`,
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Erreur lors de l'acceptation de la demande");
      } else {
        alert(data.message);
        fetchPendingRequests();
        fetchNotifications();
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'acceptation de la demande");
    }
  };

  const handleDeclineRequest = async (followerUsername: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `http://localhost:8080/api/profile/pending/${followerUsername}/decline`,
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Erreur lors du refus de la demande");
      } else {
        alert(data.message);
        fetchPendingRequests();
        fetchNotifications();
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors du refus de la demande");
    }
  };

  const handlePinTweet = async (tweetId: number) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `http://localhost:8080/api/profile/${username}/pin/${tweetId}`,
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Erreur lors de l'épinglage du tweet");
      } else {
        setPinnedTweet({ id: tweetId, ...data });
      }
    } catch (error) {
      console.error("Erreur lors de l'épinglage du tweet", error);
      alert("Erreur lors de l'épinglage du tweet");
    }
  };

  const handleUnpinTweet = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `http://localhost:8080/api/profile/${username}/unpin`,
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Erreur lors du désépinglage du tweet");
      } else {
        setPinnedTweet(null);
      }
    } catch (error) {
      console.error("Erreur lors du désépinglage du tweet", error);
      alert("Erreur lors du désépinglage du tweet");
    }
  };

  const toggleFollow = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `http://localhost:8080/api/profile/${username}/follow`,
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setFollowError(data.error || "Erreur lors du follow/unfollow");
      } else {
        if (data.message) {
          alert(data.message);
        } else {
          setFollowing(!following);
        }
        setFollowError("");
      }
    } catch (error) {
      console.error("Erreur lors du follow/unfollow", error);
      setFollowError("Erreur lors du follow/unfollow");
    }
  };

  const toggleBlock = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `http://localhost:8080/api/profile/${username}/block`,
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setBlockError(data.error || "Erreur lors du blocage/déblocage");
      } else {
        setBlockError("");
      }
    } catch (error) {
      console.error("Erreur lors du blocage/déblocage", error);
      setBlockError("Erreur lors du blocage/déblocage");
    }
  };

  const handleDeleteTweet = (tweetId: number) => {
    setTweets((prev) => prev.filter((tweet) => tweet.id !== tweetId));
  };

  if (loading) {
    return <div className="text-center mt-4">Chargement...</div>;
  }
  if (!profile) {
    return (
      <div className="text-center mt-4 text-red-500">
        Erreur de chargement du profil
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto relative">
      {/* Bannière et photo de profil */}
      <div className="relative">
        <img src={profile.banner} alt="Bannière" className="w-full h-48 object-cover" />
        <img
          src={profile.profilePicture}
          alt="Photo de profil"
          className="absolute bottom-0 left-4 w-24 h-24 rounded-full border-4 border-white transform translate-y-1/2"
        />
        {/* ... (le reste de l'en-tête et notifications) */}
      </div>
      <div className="mt-16 px-4">
        <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
        {profile.bio && <p className="text-white">{profile.bio}</p>}
        {/* ... */}
      </div>
      {profile.private && !profile.editable && !following ? (
        <div className="mt-4 px-4">
          <p className="text-white">
            Ce compte est privé. Envoyez une demande de suivi pour voir les tweets.
          </p>
        </div>
      ) : (
        <>
          {profile.editable && pinnedTweet && (
            <div className="mt-4 px-4">
              <h2 className="text-xl font-semibold text-white">Tweet épinglé</h2>
              <div className="mb-4">
                <Tweet
                  tweetId={pinnedTweet.id}
                  author={profile.username}
                  content={pinnedTweet.content}
                  profilePicture={profile.profilePicture || "default-profile.png"}
                  initialLikeCount={pinnedTweet.likeCount || 0}
                  initialRetweetCount={pinnedTweet.retweetCount || 0}
                  initialLiked={pinnedTweet.liked}
                  media={pinnedTweet.media}
                  replies={[]}
                  isOwner={profile.editable}
                  censored={pinnedTweet.censored}
                  locked={pinnedTweet.locked}
                />
                <Button
                  text="Désépingler"
                  onClick={() => {/* fonction de désépinglage */}}
                  moreClasses="bg-gray-600 text-white px-4 py-2 rounded mt-2"
                />
              </div>
            </div>
          )}
          <div className="mt-4 px-4">
            <h2 className="text-xl font-semibold mb-2 text-white">Tweets</h2>
            {tweets.length === 0 ? (
              <p className="text-white">Aucun tweet à afficher.</p>
            ) : (
              tweets.map((tweet, index) => (
                <div key={tweet.id || index}>
                  <Tweet
                    tweetId={tweet.id}
                    author={profile.username}
                    content={tweet.content}
                    profilePicture={profile.profilePicture || "default-profile.png"}
                    initialLikeCount={tweet.likeCount || 0}
                    initialLiked={tweet.liked || false}
                    initialRetweetCount={tweet.retweetCount || 0}
                    media={tweet.media}
                    replies={tweet.replies}
                    isOwner={profile.editable}
                    censored={tweet.censored}
                    locked={tweet.locked}
                    onDelete={() => {/* fonction de suppression */}}
                  />
                  {profile.editable && (
                    <Button
                      text="Épingler"
                      onClick={() => {/* fonction d'épinglage */}}
                      moreClasses="bg-green-500 text-white px-4 py-2 rounded mt-2"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;
