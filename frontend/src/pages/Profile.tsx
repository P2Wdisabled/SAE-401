import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const [showPendingPopup, setShowPendingPopup] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
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
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
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
      .then((data) => {
        setPendingRequests(data.pendingFollowRequests || []);
      })
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
      .then((data) => {
        setNotifications(data.notifications || []);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Si le profil appartient à l'utilisateur connecté, récupérer les demandes pending et notifications
  useEffect(() => {
    if (profile && profile.editable) {
      fetchPendingRequests();
      fetchNotifications();
    }
  }, [profile, fetchPendingRequests, fetchNotifications]);

  const handleAcceptRequest = async (followerUsername: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:8080/api/profile/pending/${followerUsername}/accept`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json",
        },
      });
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
      const response = await fetch(`http://localhost:8080/api/profile/pending/${followerUsername}/decline`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json",
        },
      });
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
      const response = await fetch(`http://localhost:8080/api/profile/${username}/pin/${tweetId}`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json",
        },
      });
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
      const response = await fetch(`http://localhost:8080/api/profile/${username}/unpin`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json",
        },
      });
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
      const response = await fetch(`http://localhost:8080/api/profile/${username}/follow`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json",
        },
      });
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
      const response = await fetch(`http://localhost:8080/api/profile/${username}/block`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json",
        },
      });
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
    setTweets((prevTweets) => prevTweets.filter((tweet) => tweet.id !== tweetId));
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
        {/* Icône cloche pour les demandes en attente */}
        {profile.editable && pendingRequests.length > 0 && (
          <button
            onClick={() => setShowPendingPopup(!showPendingPopup)}
            className="absolute top-4 right-16 text-white"
            title="Demandes de suivi en attente"
          >
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C10.346 2 9 3.346 9 5v1.07C6.165 7.185 4 10.044 4 13v5l-1 1v1h18v-1l-1-1v-5c0-2.956-2.165-5.815-5-6.93V5c0-1.654-1.346-3-3-3zM12 22c1.103 0 2-.897 2-2h-4c0 1.103.897 2 2 2z"/>
            </svg>
          </button>
        )}
        {/* Icône cloche pour les notifications, positionnée encore plus à droite hors de la bannière */}
        {profile.editable && notifications.length > 0 && (
          <button
            onClick={() => setShowNotificationsPopup(!showNotificationsPopup)}
            className="absolute top-4"
            style={{ right: "-40px" }}
            title="Notifications"
          >
            <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
              <path d="M12 22c1.104 0 2-.897 2-2H10c0 1.103.896 2 2 2zm6-6V11c0-3.309-2.691-6-6-6S6 7.691 6 11v5l-2 2v1h16v-1l-2-2zm-2 .001H8V11c0-2.206 1.794-4 4-4s4 1.794 4 4v5z" />
            </svg>
          </button>
        )}
        {showPendingPopup && (
          <div className="absolute top-12 right-16 bg-white text-black p-4 rounded shadow-lg z-50">
            <h3 className="font-bold mb-2">Demandes de suivi</h3>
            {pendingRequests.length === 0 ? (
              <p>Aucune demande en attente.</p>
            ) : (
              pendingRequests.map((req: any) => (
                <div key={req.username} className="flex items-center gap-2 mb-2">
                  <img
                    src={req.profilePicture}
                    alt={req.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="flex-1 text-sm">
                    <strong>{req.username}</strong> souhaite s'abonner à vous !
                  </span>
                  <div className="flex gap-1">
                    <Button
                      text="Accepter"
                      onClick={() => handleAcceptRequest(req.username)}
                      moreClasses="bg-green-500 text-white px-2 py-1 rounded text-sm"
                    />
                    <Button
                      text="Refuser"
                      onClick={() => handleDeclineRequest(req.username)}
                      moreClasses="bg-red-500 text-white px-2 py-1 rounded text-sm"
                    />
                  </div>
                </div>
              ))
            )}
            <button
              className="mt-2 text-blue-500 underline text-sm"
              onClick={() => setShowPendingPopup(false)}
            >
              Fermer
            </button>
          </div>
        )}
        {showNotificationsPopup && (
          <div className="absolute top-12 right-0 bg-white text-black p-4 rounded shadow-lg z-50 max-h-80 overflow-y-auto">
            <h3 className="font-bold mb-2">Notifications</h3>
            {notifications.length === 0 ? (
              <p>Aucune notification.</p>
            ) : (
              notifications.map((notif: any) => (
                <div key={notif.id} className="mb-2 text-sm">
                  <span>{notif.content}</span>
                  <br />
                  <span className="text-gray-500">{new Date(notif.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
            <button
              className="mt-2 text-blue-500 underline text-sm"
              onClick={() => setShowNotificationsPopup(false)}
            >
              Fermer
            </button>
          </div>
        )}
      </div>
      <div className="mt-16 px-4">
        <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
        {profile.bio && <p className="text-white">{profile.bio}</p>}
        <div className="mt-2 flex space-x-4 text-gray-500">
          {profile.location && <span>{profile.location}</span>}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500"
            >
              {profile.website}
            </a>
          )}
        </div>
        <div className="mt-4 flex flex-row gap-2">
          {profile.editable ? (
            <>
              <Button
                text="Editer le profil"
                page="/profile/edit"
                moreClasses="text-white px-4 py-2 rounded"
                bg="bg-blue-500"
              />
              <Button
                text="Liste des utilisateurs bloqués"
                page="/profile/blocked"
                moreClasses="text-white px-4 py-2 rounded"
                bg="bg-red-500"
              />
            </>
          ) : (
            <div className="flex flex-row gap-2">
              <div className="relative">
                <Button
                  text={following ? "Ne plus suivre" : "Suivre"}
                  onClick={toggleFollow}
                  moreClasses="bg-blue-500 text-white px-4 py-2 rounded"
                />
                {followError && (
                  <p className="text-red-500 text-sm mt-1 absolute w-96">{followError}</p>
                )}
              </div>
              <div>
                <Button
                  text="Bloquer"
                  onClick={toggleBlock}
                  moreClasses="bg-red-500 text-white px-4 py-2 rounded"
                />
                {blockError && (
                  <p className="text-red-500 text-sm mt-1">{blockError}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {profile.private && !profile.editable && !following ? (
        <div className="mt-4 px-4">
          <p className="text-white">Ce compte est privé. Envoyez une demande de suivi pour voir les tweets.</p>
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
                  initialLiked={pinnedTweet.liked || false}
                  media={pinnedTweet.media}
                  replies={[]} 
                  isOwner={profile.editable}
                  censored={pinnedTweet.censored}
                />
                <Button
                  text="Désépingler"
                  onClick={handleUnpinTweet}
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
                    onDelete={() => handleDeleteTweet(tweet.id)}
                  />
                  {profile.editable && (
                    <Button
                      text="Épingler"
                      onClick={() => handlePinTweet(tweet.id)}
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
