// src/components/Profile.tsx
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
  const [BlockState, setBlockState] = useState<boolean>(false);
  const [followError, setFollowError] = useState<string>("");
  const [blockError, setBlockError] = useState<string>("");

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
        setPinnedTweet(data.pinnedTweet); // Récupération du tweet épinglé
        setTweets(data.tweets);
        setFollowing(data.profile.followed);
        setBlockState(data.profile.blockedUsers);
      })
      .catch((err) => {
        console.error(err);
        // Vous pouvez gérer une erreur globale ici si nécessaire
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username, navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
        // Mettre à jour le tweet épinglé
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
        setFollowing(!following);
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
        setBlockState(!BlockState);
        if (BlockState && following) {
          setFollowing(false);
        }
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
    <div className="max-w-2xl mx-auto">
      {/* Bannière et photo de profil */}
      <div className="relative">
        <img src={profile.banner} alt="Bannière" className="w-full h-48 object-cover" />
        <img
          src={profile.profilePicture}
          alt="Photo de profil"
          className="absolute bottom-0 left-4 w-24 h-24 rounded-full border-4 border-white transform translate-y-1/2"
        />
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
                  text={BlockState ? "Débloquer" : "Bloquer"}
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
      {/* Affichage du tweet épinglé s'il existe */}
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
    </div>
  );
};

export default Profile;
