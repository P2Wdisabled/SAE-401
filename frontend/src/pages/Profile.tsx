import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Tweet from "../ui/tweet";

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    // Appel vers l'API pour récupérer les données de profil et les tweets
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
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username, navigate]);

  if (loading) {
    return <div className="text-center mt-4">Chargement...</div>;
  }
  if (!profile) {
    return <div className="text-center mt-4 text-red-500">Erreur de chargement du profil</div>;
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
        <h1 className="text-2xl font-bold">{profile.username}</h1>
        <p className="text-gray-600">{profile.bio}</p>
        <div className="mt-2 flex space-x-4 text-gray-500">
          <span>{profile.location}</span>
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500"
          >
            {profile.website}
          </a>
        </div>
        {/* Affichage conditionnel du bouton d'édition */}
        {profile.editable && (
          <div className="mt-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded">
              Editer le profil
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 px-4">
        <h2 className="text-xl font-semibold mb-2">Tweets</h2>
        {tweets.length === 0 ? (
          <p>Aucun tweet à afficher.</p>
        ) : (
          tweets.map((tweet, index) => (
            <Tweet
              key={tweet.id || index}
              tweetId={tweet.id}
              author={profile.username}
              content={tweet.content}
              profilePicture={profile.profilePicture}
              initialLikeCount={tweet.likeCount || 0}
              initialLiked={false} // Implémentez la logique du like si besoin
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;
