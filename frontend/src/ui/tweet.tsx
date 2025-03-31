import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

type TweetProps = {
  tweetId: number;
  author: string;
  content: string;
  profilePicture: string;
  initialLikeCount: number;
  initialLiked: boolean;
  isOwner: boolean;
  media?: string[]; // Ajout de la propriété pour les URLs des médias
  onDelete?: () => void;
};

const Tweet: React.FC<TweetProps> = ({
  tweetId,
  author,
  content,
  profilePicture,
  initialLikeCount,
  initialLiked,
  media,
  isOwner,
  onDelete,
}) => {
  const [liked, setLiked] = useState<boolean>(initialLiked);
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount);
  const navigate = useNavigate();

  const toggleLike = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/posts/${tweetId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
      });

      if (!response.ok) {
        console.error("Erreur lors du toggle like");
        return;
      }

      const data = await response.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch (error) {
      console.error("Erreur lors du toggle like", error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce tweet ?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/posts/${tweetId}`, {
        method: "DELETE",
        headers: {
          "Authorization": "Bearer " + token,
        },
      });
      if (!response.ok) {
        console.error("Erreur lors de la suppression du tweet");
        return;
      }
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du tweet", error);
    }
  };

  return (
    <article className="flex items-start gap-3 py-3 border-b border-gray-600">
      <Link to={`/profile/${author}`}>
        <img src={profilePicture} alt={`${author} profile`} className="rounded-full w-10 h-10" />
      </Link>
      <div className="flex-1">
        <Link to={`/profile/${author}`}>
          <p className="text-white font-semibold">{author}</p>
        </Link>
        <p className="text-gray-300">{content}</p>

        {/* Affichage des médias associés, s'il y en a */}
        {media && media.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {media.map((url, index) =>
              url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                <img
                  key={index}
                  src={url}
                  alt={`media-${index}`}
                  className="max-h-60 object-cover"
                />
              ) : (
                <video
                  key={index}
                  src={url}
                  controls
                  className="max-h-60 object-cover"
                />
              )
            )}
          </div>
        )}

        <div className="flex items-center gap-4 mt-2">
          <div onClick={toggleLike} className="flex items-center gap-1 cursor-pointer">
            {liked ? (
              <svg
                width="20"
                height="18"
                viewBox="0 0 20 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.8201 1.57997L9.99907 2.40197L9.17607 1.57897C8.16812 0.570879 6.80098 0.00448831 5.37543 0.00439454C3.94987 0.00430077 2.58266 0.570511 1.57457 1.57847C0.566484 2.58642 9.37798e-05 3.95356 1.16446e-08 5.37911C-9.37565e-05 6.80467 0.566117 8.17188 1.57407 9.17997L9.47007 17.076C9.6107 17.2164 9.80132 17.2953 10.0001 17.2953C10.1988 17.2953 10.3894 17.2164 10.5301 17.076L18.4321 9.17897C19.3979 8.16109 19.9278 6.80618 19.9088 5.40316C19.8898 4.00015 19.3235 2.66006 18.3305 1.66867C17.3376 0.67728 15.9966 0.113045 14.5935 0.0962873C13.1905 0.0795297 11.8364 0.612576 10.8201 1.57997Z"
                  fill="url(#paint0_linear_384_1368)"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_384_1368"
                    x1="-4.37593"
                    y1="-4.93803"
                    x2="6.13507"
                    y2="17.378"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#F97DBD" />
                    <stop offset="1" stopColor="#D7257D" />
                  </linearGradient>
                </defs>
              </svg>
            ) : (
              <svg
                width="20"
                height="19"
                viewBox="0 0 20 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.1 15.55L10 15.65L9.89 15.55C5.14 11.24 2 8.39 2 5.5C2 3.5 3.5 2 5.5 2C7.04 2 8.54 3 9.07 4.36H10.93C11.46 3 12.96 2 14.5 2C16.5 2 18 3.5 18 5.5C18 8.39 14.86 11.24 10.1 15.55ZM14.5 0C12.76 0 11.09 0.81 10 2.08C8.91 0.81 7.24 0 5.5 0C2.42 0 0 2.41 0 5.5C0 9.27 3.4 12.36 8.55 17.03L10 18.35L11.45 17.03C16.6 12.36 20 9.27 20 5.5C20 2.41 17.58 0 14.5 0Z"
                  fill="white"
                />
              </svg>
            )}
            <span className="text-white">{likeCount}</span>
          </div>
          {isOwner && (
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default Tweet;
