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

      // If the profile is editable and the comment limit option is not defined, retrieve it
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

  // Calculate the total number of unread items (notifications + requests)
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
      alert(error.message || "Error accepting follow request");
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
      alert(error.message || "Error declining follow request");
    }
  };

  const handlePinTweet = async (tweetId: number) => {
    const token = localStorage.getItem("token");
    if (!token || !username) return;
    try {
      const data = await pinTweet(token, username, tweetId);
      setPinnedTweet({ id: tweetId, ...data });
    } catch (error: any) {
      alert(error.message || "Error pinning tweet");
    }
  };

  const handleUnpinTweet = async () => {
    const token = localStorage.getItem("token");
    if (!token || !username) return;
    try {
      await unpinTweet(token, username);
      setPinnedTweet(null);
    } catch (error: any) {
      alert(error.message || "Error unpinning tweet");
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
      setFollowError(error.message || "Error following/unfollowing");
    }
  };

  const handleToggleBlock = async () => {
    const token = localStorage.getItem("token");
    if (!token || !username) return;
    try {
      await toggleBlock(token, username);
      setBlockError("");
    } catch (error: any) {
      setBlockError(error.message || "Error blocking/unblocking");
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
      alert(error.message || "Error updating comment option");
    }
  };

  const handleDeleteTweet = (tweetId: number) => {
    setTweets((prev) => prev.filter((tweet) => tweet.id !== tweetId));
  };

  if (loading) {
    return <div className="text-center mt-4">Loading...</div>;
  }
  if (!profile) {
    return (
      <div className="text-center mt-4 text-red-500">
        Error loading profile
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto relative">
      {/* Banner and Profile Picture */}
      <div className="relative">
        <img src={profile.banner} alt="Banner" className="w-full h-48 object-cover" />
        <img
          src={profile.profilePicture}
          alt="Profile picture"
          className="absolute bottom-0 left-4 w-24 h-24 rounded-full border-4 border-white transform translate-y-1/2"
        />
        {profile.editable && (
          <button
            onClick={() => setShowNotificationsPopup(!showNotificationsPopup)}
            className="absolute top-4"
            style={{ right: "-40px" }}
            title="Notifications and follow requests"
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
        {/* Popup for notifications and follow requests */}
        {showNotificationsPopup && (
          <div className="absolute top-12 right-0 bg-white text-black p-4 rounded shadow-lg z-50 max-h-80 overflow-y-auto">
            {pendingRequests.length > 0 && (
              <>
                <h3 className="font-bold mb-2">Follow Requests</h3>
                {pendingRequests.map((req: any) => (
                  <div key={req.username} className="flex items-center gap-2 mb-2">
                    <img
                      src={req.profilePicture}
                      alt={req.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="flex-1 text-sm">
                      <strong>{req.username}</strong> wants to follow you!
                    </span>
                    <div className="flex gap-1">
                      <Button
                        text="Accept"
                        onClick={() => handleAcceptRequest(req.username)}
                        variant="success"
                        size="small"
                      />
                      <Button
                        text="Decline"
                        onClick={() => handleDeclineRequest(req.username)}
                        variant="danger"
                        size="small"
                      />
                    </div>
                  </div>
                ))}
                <hr className="my-2" />
              </>
            )}
            <h3 className="font-bold mb-2">Notifications</h3>
            {notifications.length === 0 ? (
              <p>No notifications.</p>
            ) : (
              notifications.map((notif: any) => (
                <div key={notif.id} className="mb-2 text-sm">
                  <span>{notif.content}</span>
                  <br />
                  <span className="text-gray-500">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
            <button
              className="mt-2 text-blue-500 underline text-sm"
              onClick={() => setShowNotificationsPopup(false)}
            >
              Close
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
        <div className="mt-4 flex flex-row items-center gap-2">
          {profile.editable ? (
            <>
              <Button
                page="/profile/edit"
                object={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M14.304 4.84412L17.156 7.69612M7 7.00012H4C3.73478 7.00012 3.48043 7.10547 3.29289 7.29301C3.10536 7.48055 3 7.7349 3 8.00012V18.0001C3 18.2653 3.10536 18.5197 3.29289 18.7072C3.48043 18.8948 3.73478 19.0001 4 19.0001H15C15.2652 19.0001 15.5196 18.8948 15.7071 18.7072C15.8946 18.5197 16 18.2653 16 18.0001V13.5001M18.409 3.59012C18.5964 3.77742 18.745 3.99981 18.8464 4.24457C18.9478 4.48933 19 4.75168 19 5.01662C19 5.28156 18.9478 5.5439 18.8464 5.78866C18.745 6.03343 18.5964 6.25581 18.409 6.44312L11.565 13.2871L8 14.0001L8.713 10.4351L15.557 3.59112C15.7442 3.40365 15.9664 3.25493 16.2111 3.15346C16.4558 3.05199 16.7181 2.99976 16.983 2.99976C17.2479 2.99976 17.5102 3.05199 17.7549 3.15346C17.9996 3.25493 18.2218 3.40365 18.409 3.59112V3.59012Z"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                }
                variant="primary"
                size="small"
              />
              <Button
                text="Blocked Users List"
                page="/profile/blocked"
                variant="danger"
                size="small"
              />
              <Button
                object={
                  profile.limitCommentsToSubscribers ? (
                    <svg
                      width="50"
                      height="50"
                      viewBox="0 0 30 30"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M23 5H7C5.9 5 5 5.9 5 7V25L9 21H23C24.1 21 25 20.1 25 19V7C25 5.9 24.1 5 23 5ZM23 19H8.2L7 20.2V7H23V19Z" fill="white"/>
                      <g clipPath="url(#clip0_410_1377)">
                        <path d="M15.0048 29.25C13.0351 29.25 11.1826 28.8763 9.44725 28.129C7.71297 27.3806 6.20406 26.3652 4.9205 25.0827C3.63694 23.8002 2.62097 22.2928 1.87258 20.5607C1.12419 18.8285 0.75 16.9765 0.75 15.0048C0.75 13.033 1.12419 11.1805 1.87258 9.44725C2.61992 7.71297 3.63378 6.20406 4.91417 4.9205C6.19456 3.63694 7.70242 2.62097 9.43775 1.87258C11.1731 1.12419 13.0256 0.75 14.9952 0.75C16.9649 0.75 18.8174 1.12419 20.5528 1.87258C22.287 2.61992 23.7959 3.63431 25.0795 4.91575C26.3631 6.19719 27.379 7.70506 28.1274 9.43933C28.8758 11.1736 29.25 13.0256 29.25 14.9952C29.25 16.9649 28.8763 18.8174 28.129 20.5528C27.3817 22.2881 26.3662 23.797 25.0827 25.0795C23.7991 26.362 22.2918 27.378 20.5607 28.1274C18.8296 28.8769 16.9776 29.2511 15.0048 29.25ZM15 27.6667C18.5361 27.6667 21.5312 26.4396 23.9854 23.9854C26.4396 21.5312 27.6667 18.5361 27.6667 15C27.6667 11.4639 26.4396 8.46875 23.9854 6.01458C21.5312 3.56042 18.5361 2.33333 15 2.33333C11.4639 2.33333 8.46875 3.56042 6.01458 6.01458C3.56042 8.46875 2.33333 11.4639 2.33333 15C2.33333 18.5361 3.56042 21.5312 6.01458 23.9854C8.46875 26.4396 11.4639 27.6667 15 27.6667Z" fill="white"/>
                        </g>
                      <defs>
                        <clipPath id="clip0_410_1377">
                          <rect width="30" height="30" fill="white"/>
                        </clipPath>
                      </defs>
                    </svg>
                  ) : (
                    <svg
                      width="50"
                      height="50"
                      viewBox="0 0 30 30"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M23 5H7C5.9 5 5 5.9 5 7V25L9 21H23C24.1 21 25 20.1 25 19V7C25 5.9 24.1 5 23 5ZM23 19H8.2L7 20.2V7H23V19Z" fill="white"/>
                      <g clipPath="url(#clip0_411_1390)">
                        <path d="M15.0048 29.25C13.0351 29.25 11.1826 28.8763 9.44725 28.129C7.71297 27.3806 6.20406 26.3652 4.9205 25.0827C3.63694 23.8002 2.62097 22.2928 1.87258 20.5607C1.12419 18.8285 0.75 16.9765 0.75 15.0048C0.75 13.033 1.12419 11.1805 1.87258 9.44725C2.61992 7.71297 3.63378 6.20406 4.91417 4.9205C6.19456 3.63694 7.70242 2.62097 9.43775 1.87258C11.1731 1.12419 13.0256 0.75 14.9952 0.75C16.9649 0.75 18.8174 1.12419 20.5528 1.87258C22.287 2.61992 23.7959 3.63431 25.0795 4.91575C26.3631 6.19719 27.379 7.70506 28.1274 9.43933C28.8758 11.1736 29.25 13.0256 29.25 14.9952C29.25 16.9649 28.8763 18.8174 28.129 20.5528C27.3817 22.2881 26.3662 23.797 25.0827 25.0795C23.7991 26.362 22.2918 27.378 20.5607 28.1274C18.8296 28.8769 16.9776 29.2511 15.0048 29.25ZM15 27.6667C18.5361 27.6667 21.5312 26.4396 23.9854 23.9854C26.4396 21.5312 27.6667 18.5361 27.6667 15C27.6667 11.4639 26.4396 8.46875 23.9854 6.01458C21.5312 3.56042 18.5361 2.33333 15 2.33333C11.4639 2.33333 8.46875 3.56042 6.01458 6.01458C3.56042 8.46875 2.33333 11.4639 2.33333 15C2.33333 18.5361 3.56042 21.5312 6.01458 23.9854C8.46875 26.4396 11.4639 27.6667 15 27.6667Z" fill="white"/>
                      <path d="M5 5L24 25" stroke="white" strokeWidth="2"/>
                      </g>
                      <defs>
                        <clipPath id="clip0_411_1390">
                          <rect width="30" height="30" fill="white"/>
                        </clipPath>
                      </defs>
                    </svg>
                  )
                }
                onClick={handleToggleCommentsLimit}
                variant="transparent"
                size="small"
              />
            </>
          ) : (
            <div className="flex flex-row gap-2">
              <div className="relative">
                <Button
                  text={following ? "Unfollow" : "Follow"}
                  onClick={handleToggleFollow}
                  variant="primary"
                  size="small"
                />
                {followError && (
                  <p className="text-red-500 text-sm mt-1 absolute w-96">
                    {followError}
                  </p>
                )}
              </div>
              <div>
                <Button
                  text="Block"
                  onClick={handleToggleBlock}
                  variant="danger"
                  size="small"
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
            This account is private. Send a follow request to see the tweets.
          </p>
        </div>
      ) : (
        <>
          {profile.editable && pinnedTweet && (
            <div className="mt-4 px-4">
              <h2 className="text-xl font-semibold text-white">Pinned Tweet</h2>
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
                  object={
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2.5L9 6.5L5 8L3.5 9.5L10.5 16.5L12 15L13.5 11L17.5 7M7 13L2.5 17.5M12.5 2L18 7.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                  onClick={handleUnpinTweet}
                  variant="secondary"
                  size="small"
                />
              </div>
            </div>
          )}
          <div className="mt-4 px-4">
            <h2 className="text-xl font-semibold mb-2 text-white">Tweets</h2>
            {tweets.length === 0 ? (
              <p className="text-white">No tweets to display.</p>
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
                      object={
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 2.5L9 6.5L5 8L3.5 9.5L10.5 16.5L12 15L13.5 11L17.5 7M7 13L2.5 17.5M12.5 2L18 7.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      }
                      onClick={() => handlePinTweet(tweet.id)}
                      variant="success"
                      size="small"
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
