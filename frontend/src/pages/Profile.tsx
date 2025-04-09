// src/components/Profile.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Tweet from "../ui/tweet";
import Button from "../ui/Button";
import { getProfile } from "../api/getProfile";
import { getPendingRequests } from "../api/getPendingRequests";
import { getNotifications } from "../api/getNotifications";
import { getLimitComments } from "../api/getLimitComments";
import { markNotificationsRead } from "../api/markNotificationsRead";
import { acceptFollowRequest } from "../api/acceptFollowRequest";
import { declineFollowRequest } from "../api/declineFollowRequest";
import { pinTweet } from "../api/pinTweet";
import { unpinTweet } from "../api/unpinTweet";
import { toggleFollow } from "../api/toggleFollow";
import { toggleBlock } from "../api/toggleBlock";
import { toggleCommentsLimit } from "../api/toggleCommentsLimit";
import { useCheckToken } from "../components/Checker";

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
  const [showNotificationsPopup, setShowNotificationsPopup] = useState<boolean>(false);
  const [pendingLoaded, setPendingLoaded] = useState(false);

  const navigate = useNavigate();
  useCheckToken();

  const fetchProfileData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !username) {
      navigate("/landing");
      return;
    }
    setLoading(true);
    try {
      const data = await getProfile(username, token);
      setFollowError("");
      setBlockError("");
      setProfile(data.profile);
      setPinnedTweet(data.pinnedTweet);
      setTweets(data.tweets);
      setFollowing(data.profile.followed);

      // Si le profil est éditable et que l'option de limitation n'est pas définie, on la récupère
      if (data.profile.editable && typeof data.profile.limitCommentsToSubscribers === "undefined") {
        try {
          const limited = await getLimitComments(token);
          setProfile((prev: any) => ({
            ...prev,
            limitCommentsToSubscribers: limited,
          }));
        } catch (err) {
          console.error(err);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [username, navigate]);

  const loadPendingRequests = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const pending = await getPendingRequests(token);
      setPendingRequests(pending);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const notifs = await getNotifications(token);
      setNotifications(notifs);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  useEffect(() => {
    if (profile && profile.editable && !pendingLoaded) {
      loadPendingRequests();
      loadNotifications();
      setPendingLoaded(true);
    }
  }, [profile, pendingLoaded, loadPendingRequests, loadNotifications]);

  // Calcul du nombre total d’éléments non lus (notifications + demandes)
  const unreadCount =
    notifications.filter((notif: any) => !notif.isRead).length +
    pendingRequests.length;

  useEffect(() => {
    if (showNotificationsPopup) {
      const token = localStorage.getItem("token");
      if (!token) return;
      markNotificationsRead(token)
        .then(() => loadNotifications())
        .catch((err) => console.error(err));
    }
  }, [showNotificationsPopup, loadNotifications]);

  const handleAcceptRequest = async (followerUsername: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const data = await acceptFollowRequest(token, followerUsername);
      alert(data.message);
      loadPendingRequests();
      loadNotifications();
    } catch (error: any) {
      alert(error.message || "Erreur lors de l'acceptation de la demande");
    }
  };

  const handleDeclineRequest = async (followerUsername: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const data = await declineFollowRequest(token, followerUsername);
      alert(data.message);
      loadPendingRequests();
      loadNotifications();
    } catch (error: any) {
      alert(error.message || "Erreur lors du refus de la demande");
    }
  };

  const handlePinTweet = async (tweetId: number) => {
    const token = localStorage.getItem("token");
    if (!token || !username) return;
    try {
      const data = await pinTweet(token, username, tweetId);
      setPinnedTweet({ id: tweetId, ...data });
    } catch (error: any) {
      alert(error.message || "Erreur lors de l'épinglage du tweet");
    }
  };

  const handleUnpinTweet = async () => {
    const token = localStorage.getItem("token");
    if (!token || !username) return;
    try {
      await unpinTweet(token, username);
      setPinnedTweet(null);
    } catch (error: any) {
      alert(error.message || "Erreur lors du désépinglage du tweet");
    }
  };

  const handleToggleFollow = async () => {
    const token = localStorage.getItem("token");
    if (!token || !username) return;
    try {
      const data = await toggleFollow(token, username);
      if (data.message) {
        alert(data.message);
      } else {
        setFollowing(!following);
      }
      setFollowError("");
    } catch (error: any) {
      setFollowError(error.message || "Erreur lors du follow/unfollow");
    }
  };

  const handleToggleBlock = async () => {
    const token = localStorage.getItem("token");
    if (!token || !username) return;
    try {
      await toggleBlock(token, username);
      setBlockError("");
    } catch (error: any) {
      setBlockError(error.message || "Erreur lors du blocage/déblocage");
    }
  };

  const handleToggleCommentsLimit = async () => {
    const token = localStorage.getItem("token");
    if (!token || !profile) return;
    try {
      await toggleCommentsLimit(token, profile.limitCommentsToSubscribers);
      setProfile({
        ...profile,
        limitCommentsToSubscribers: !profile.limitCommentsToSubscribers,
      });
    } catch (error: any) {
      alert(error.message || "Erreur lors de la mise à jour de l'option de commentaire");
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
        {profile.editable && (
          <button
            onClick={() => setShowNotificationsPopup(!showNotificationsPopup)}
            className="absolute top-4"
            style={{ right: "-40px" }}
            title="Notifications et demandes de suivi"
          >
            <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
              <path d="M12 22c1.104 0 2-.897 2-2H10c0 1.103.896 2 2 2zm6-6V11c0-3.309-2.691-6-6-6S6 7.691 6 11v5l-2 2v1h16v-1l-2-2zm-2 .001H8V11c0-2.206 1.794-4 4-4s4 1.794 4 4v5z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        )}
        {/* Popup pour notifications et demandes de suivi */}
        {showNotificationsPopup && (
          <div className="absolute top-12 right-0 bg-white text-black p-4 rounded shadow-lg z-50 max-h-80 overflow-y-auto">
            {pendingRequests.length > 0 && (
              <>
                <h3 className="font-bold mb-2">Demandes de suivi</h3>
                {pendingRequests.map((req: any) => (
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
                ))}
                <hr className="my-2" />
              </>
            )}
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
              <Button
                text={
                  profile.limitCommentsToSubscribers
                    ? "Désactiver limitation des commentaires"
                    : "Activer limitation des commentaires"
                }
                onClick={handleToggleCommentsLimit}
                moreClasses="bg-indigo-500 text-white px-4 py-2 rounded mt-2"
              />
            </>
          ) : (
            <div className="flex flex-row gap-2">
              <div className="relative">
                <Button
                  text={following ? "Ne plus suivre" : "Suivre"}
                  onClick={handleToggleFollow}
                  moreClasses="bg-blue-500 text-white px-4 py-2 rounded"
                />
                {followError && (
                  <p className="text-red-500 text-sm mt-1 absolute w-96">
                    {followError}
                  </p>
                )}
              </div>
              <div>
                <Button
                  text="Bloquer"
                  onClick={handleToggleBlock}
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
                    locked={tweet.locked}
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
