import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Tweet from "../ui/tweet";
import Button from "../ui/Button";

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<boolean>(false);
  const [BlockState, setBlockState] = useState<boolean>(false);
  const navigate = useNavigate();

  const fetchProfile = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    fetch(`http://localhost:8080/profile/${username}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur lors du chargement du profil");
        }
        return res.json();
      })
      .then((data) => {
        setProfile(data.profile);
        setTweets(data.tweets);
        setFollowing(data.profile.followed);
        // Vérifier si le profil courant est dans la liste
        setBlockState(data.profile.blockedUsers);
        // data.profile.blocked correspond au blocage admin, on ne met pas à jour userBlocked ici
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username, navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);


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
      if (data.error) {
        console.error(data.error);
      } else {
        setFollowing(!following);
      }
    } catch (error) {
      console.error("Erreur lors du follow/unfollow", error);
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
      // Vérifier si le profil courant est dans la liste
      setBlockState(!BlockState);
      if (BlockState && following) {
        setFollowing(false);
      }
    } catch (error) {
      console.error("Erreur lors du blocage/déblocage", error);
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
        <div className="mt-4 flex gap-2">
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
            <>
              <Button
                text={following ? "Ne plus suivre" : "Suivre"}
                onClick={toggleFollow}
                moreClasses="bg-blue-500 text-white px-4 py-2 rounded"
              />
              {/* N'afficher le bouton de blocage que si le compte n'est pas bloqué par l'admin */}
                <Button
                  text={BlockState  ? "Débloquer" : "Bloquer"}
                  onClick={toggleBlock}
                  moreClasses="bg-red-500 text-white px-4 py-2 rounded"
                />
            </>
          )}
        </div>
      </div>
      <div className="mt-4 px-4">
        <h2 className="text-xl font-semibold mb-2 text-white">Tweets</h2>
        {tweets.length === 0 ? (
          <p className="text-white">Aucun tweet à afficher.</p>
        ) : (
          tweets.map((tweet, index) => (
            <Tweet
              key={tweet.id || index}
              tweetId={tweet.id}
              author={profile.username}
              content={tweet.content}
              profilePicture={profile.profilePicture || "default-profile.png"}
              initialLikeCount={tweet.likeCount || 0}
              initialLiked={tweet.liked || false}
              media={tweet.media}
              replies={tweet.replies}
              isOwner={profile.editable}
              onDelete={() => handleDeleteTweet(tweet.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;
