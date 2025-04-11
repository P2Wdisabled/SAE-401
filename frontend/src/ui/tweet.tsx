import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

type TweetProps = {
  tweetId: number;
  author: string;
  content: string;
  profilePicture: string;
  initialLikeCount: number;
  initialRetweetCount: number;
  initialLiked: boolean;
  isOwner: boolean;
  censored?: boolean;
  media?: string[];
  replies?: any[];
  locked?: boolean;
  onDelete?: () => void;
};

const parseContent = (text: string): React.ReactNode[] => {
  const regex = /(\B#[a-zA-Z0-9_]+)|(\B@[a-zA-Z0-9_]+)/g;
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (!part) return null;
    if (part.startsWith("#")) {
      const tag = part.substring(1);
      return (
        <Link key={index} to={`/hashtag/${tag}`} className="text-blue-400 hover:underline">
          {part}
        </Link>
      );
    } else if (part.startsWith("@")) {
      const username = part.substring(1);
      return (
        <Link key={index} to={`/profile/${username}`} className="text-blue-400 hover:underline">
          {part}
        </Link>
      );
    } else {
      return part;
    }
  });
};

const Tweet: React.FC<TweetProps> = ({
  tweetId,
  author,
  content,
  profilePicture,
  initialLikeCount,
  initialRetweetCount,
  initialLiked,
  censored = false,
  media = [],
  replies = [],
  isOwner,
  locked = false,
  onDelete,
}) => {
  const [liked, setLiked] = useState<boolean>(initialLiked);
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount);
  const [retweetCount, setRetweetCount] = useState<number>(initialRetweetCount);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>(content);
  const [editMedia, setEditMedia] = useState<string[]>(media);
  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);
  const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
  const [replyContent, setReplyContent] = useState<string>("");
  const [localReplies, setLocalReplies] = useState<any[]>(replies);
  const [actionError, setActionError] = useState<string>("");
  const [isLockedState, setIsLockedState] = useState<boolean>(locked);
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
        const data = await response.json();
        setActionError(data.error || "Erreur lors du toggle like");
        return;
      }
      const data = await response.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
      setActionError("");
    } catch (error) {
      console.error("Erreur lors du toggle like", error);
      setActionError("Erreur lors du toggle like");
    }
  };

  const handleRetweet = async () => {
    const token = localStorage.getItem("token");
    const comment = window.prompt("Ajouter un commentaire (optionnel) pour retweeter :");
    try {
      const response = await fetch(`http://localhost:8080/api/posts/${tweetId}/retweet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        body: JSON.stringify({ comment }),
      });
      if (!response.ok) {
        const data = await response.json();
        setActionError(data.error || "Erreur lors du retweet");
        return;
      }
      const data = await response.json();
      if (data.retweet && data.retweet.retweetCount !== undefined) {
        setRetweetCount(data.retweet.retweetCount);
      }
      alert("Retweet effectué avec succès !");
      setActionError("");
    } catch (error) {
      console.error("Erreur lors du retweet", error);
      setActionError("Erreur lors du retweet");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce tweet ?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/posts/${tweetId}`, {
        method: "DELETE",
        headers: {
          "Authorization": "Bearer " + token,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        setActionError(data.error || "Erreur lors de la suppression du tweet");
        return;
      }
      if (onDelete) onDelete();
      setActionError("");
    } catch (error) {
      console.error("Erreur lors de la suppression du tweet", error);
      setActionError("Erreur lors de la suppression du tweet");
    }
  };

  const handleEditSave = async () => {
    const token = localStorage.getItem("token");
    let uploadedMediaUrls: string[] = [];
    for (const file of newMediaFiles) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch("http://localhost:8080/api/upload", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
          },
          body: formData,
        });
        if (!response.ok) {
          const data = await response.json();
          console.error("Erreur lors de l'upload d'un fichier:", data.error);
          continue;
        }
        const data = await response.json();
        uploadedMediaUrls.push(data.url);
      } catch (error) {
        console.error("Erreur lors de l'upload :", error);
      }
    }
    const updatedMedia = [...editMedia, ...uploadedMediaUrls];
    try {
      const response = await fetch(`http://localhost:8080/api/posts/${tweetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        body: JSON.stringify({ content: editContent, media: updatedMedia }),
      });
      if (!response.ok) {
        const data = await response.json();
        setActionError(data.error || "Erreur lors de la mise à jour du tweet");
        return;
      }
      const data = await response.json();
      setEditMedia(data.post.media);
      setIsEditing(false);
      setActionError("");
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      setActionError("Erreur lors de la mise à jour du tweet");
    }
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setEditMedia(media);
    setNewMediaFiles([]);
    setIsEditing(false);
    setActionError("");
  };

  const handleNewMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewMediaFiles((prev) => [...prev, ...files]);
    }
  };

  const removeExistingMedia = (url: string) => {
    setEditMedia((prev) => prev.filter((mediaUrl) => mediaUrl !== url));
  };

  const removeNewMedia = (file: File) => {
    setNewMediaFiles((prev) => prev.filter((f) => f !== file));
  };

  const handleReplySubmit = async () => {
    if (replyContent.trim() === "") return;
    // Empêcher l'envoi si le tweet est verrouillé (bien que le formulaire ne soit plus accessible)
    if (isLockedState) {
      setActionError("Les réponses sont verrouillées pour ce post.");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:8080/api/posts/${tweetId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        body: JSON.stringify({ content: replyContent, media: [] }),
      });
      if (!response.ok) {
        const data = await response.json();
        setActionError(data.error || "Erreur lors de l'envoi de la réponse");
        return;
      }
      const data = await response.json();
      setLocalReplies((prev) => [...prev, data]);
      setReplyContent("");
      setShowReplyForm(false);
      setActionError("");
    } catch (error) {
      console.error("Erreur lors de l'envoi de la réponse", error);
      setActionError("Erreur lors de l'envoi de la réponse");
    }
  };

  const handleLock = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/posts/${tweetId}/lock`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        setActionError(data.error || "Erreur lors du verrouillage");
        return;
      }
      const data = await response.json();
      setIsLockedState(true);
      setActionError("");
    } catch (error) {
      console.error("Erreur lors du verrouillage", error);
      setActionError("Erreur lors du verrouillage");
    }
  };

  const handleUnlock = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/posts/${tweetId}/unlock`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        setActionError(data.error || "Erreur lors du déverrouillage");
        return;
      }
      const data = await response.json();
      setIsLockedState(false);
      setActionError("");
    } catch (error) {
      console.error("Erreur lors du déverrouillage", error);
      setActionError("Erreur lors du déverrouillage");
    }
  };

  return (
    <article className="flex flex-col gap-2 py-3 border-b border-gray-600">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${author}`}>
          <img src={profilePicture} alt={`${author} profile`} className="rounded-full w-10 h-10" />
        </Link>
        <div className="flex-1">
          <Link to={`/profile/${author}`}>
            <p className="text-white font-semibold">{author}</p>
          </Link>
          {!isEditing ? (
            <>
              <p className={`text-gray-300 ${censored ? "italic" : ""}`}>{parseContent(content)}</p>
              {isLockedState && (
                <p className="text-red-400 text-sm">Les réponses sont verrouillées.</p>
              )}
              {!censored && media && media.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {media.map((url, index) =>
                    url.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i) ? (
                      <img key={index} src={url} alt={`media-${index}`} className="max-h-60 object-cover" />
                    ) : url.match(/\.(mp4|mov|avi|flv|mvw|webm|mkv)$/i) ? (
                      <video key={index} src={url} controls className="max-h-60 object-cover" />
                    ) : url.match(/\.(mp3|wav|flac|aiff|alac|aac|ogg|wma)$/i) ? (
                      <audio key={index} controls className="max-h-60">
                        <source src={url} type="audio/mpeg" />
                      </audio>
                    ) : (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border rounded bg-gray-100 text-blue-600 hover:underline"
                      >
                        📄 Voir le fichier {url.split('/').pop()}
                      </a>
                    )
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <textarea
                className="w-full bg-transparent text-white outline-none resize-none placeholder-gray-400"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              {editMedia && editMedia.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {editMedia.map((url, index) =>
                    url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                      <div key={index} className="relative">
                        <img src={url} alt={`media-${index}`} className="max-h-60 object-cover" />
                        <button className="absolute top-0 right-0 bg-red-500 text-white px-1" onClick={() => removeExistingMedia(url)}>
                          X
                        </button>
                      </div>
                    ) : (
                      <div key={index} className="relative">
                        <video src={url} controls className="max-h-60 object-cover" />
                        <button className="absolute top-0 right-0 bg-red-500 text-white px-1" onClick={() => removeExistingMedia(url)}>
                          X
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
              <div className="mt-2">
                <label htmlFor={`new-media-${tweetId}`} className="cursor-pointer bg-gray-700 p-2 rounded">
                  Ajouter des fichiers
                </label>
                <input
                  id={`new-media-${tweetId}`}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleNewMediaChange}
                  className="hidden"
                />
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={handleEditSave} className="px-3 py-1 bg-green-500 text-white rounded">
                  Sauvegarder
                </button>
                <button onClick={handleCancelEdit} className="px-3 py-1 bg-gray-500 text-white rounded">
                  Annuler
                </button>
              </div>
            </>
          )}
          <div className="flex items-center gap-4 mt-2">
            <div onClick={toggleLike} className="flex items-center gap-1 cursor-pointer">
              {liked ? (
                <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.8201 1.57997L9.99907 2.40197L9.17607 1.57897C8.16812 0.570879 6.80098 0.00448831 5.37543 0.00439454C3.94987 0.00430077 2.58266 0.570511 1.57457 1.57847C0.566484 2.58642 9.37798e-05 3.95356 1.16446e-08 5.37911C-9.37565e-05 6.80467 0.566117 8.17188 1.57407 9.17997L9.47007 17.076C9.6107 17.2164 9.80132 17.2953 10.0001 17.2953C10.1988 17.2953 10.3894 17.2164 10.5301 17.076L18.4321 9.17897C19.3979 8.16109 19.9278 6.80618 19.9088 5.40316C19.8898 4.00015 19.3235 2.66006 18.3305 1.66867C17.3376 0.67728 15.9966 0.113045 14.5935 0.0962873C13.1905 0.0795297 11.8364 0.612576 10.8201 1.57997Z" fill="url(#paint0_linear_384_1368)"/>
                  <defs>
                    <linearGradient id="paint0_linear_384_1368" x1="-4.37593" y1="-4.93803" x2="6.13507" y2="17.378" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F97DBD" />
                      <stop offset="1" stopColor="#D7257D" />
                    </linearGradient>
                  </defs>
                </svg>
              ) : (
                <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.1 15.55L10 15.65L9.89 15.55C5.14 11.24 2 8.39 2 5.5C2 3.5 3.5 2 5.5 2C7.04 2 8.54 3 9.07 4.36H10.93C11.46 3 12.96 2 14.5 2C16.5 2 18 3.5 18 5.5C18 8.39 14.86 11.24 10.1 15.55ZM14.5 0C12.76 0 11.09 0.81 10 2.08C8.91 0.81 7.24 0 5.5 0C2.42 0 0 2.41 0 5.5C0 9.27 3.4 12.36 8.55 17.03L10 18.35L11.45 17.03C16.6 12.36 20 9.27 20 5.5C20 2.41 17.58 0 14.5 0Z" fill="white"/>
                </svg>
              )}
              <span className="text-white">{likeCount}</span>
            </div>
            {isOwner && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.304 4.84412L17.156 7.69612M7 7.00012H4C3.73478 7.00012 3.48043 7.10547 3.29289 7.29301C3.10536 7.48055 3 7.7349 3 8.00012V18.0001C3 18.2653 3.10536 18.5197 3.29289 18.7072C3.48043 18.8948 3.73478 19.0001 4 19.0001H15C15.2652 19.0001 15.5196 18.8948 15.7071 18.7072C15.8946 18.5197 16 18.2653 16 18.0001V13.5001M18.409 3.59012C18.5964 3.77742 18.745 3.99981 18.8464 4.24457C18.9478 4.48933 19 4.75168 19 5.01662C19 5.28156 18.9478 5.5439 18.8464 5.78866C18.745 6.03343 18.5964 6.25581 18.409 6.44312L11.565 13.2871L8 14.0001L8.713 10.4351L15.557 3.59112C15.7442 3.40365 15.9664 3.25493 16.2111 3.15346C16.4558 3.05199 16.7181 2.99976 16.983 2.99976C17.2479 2.99976 17.5102 3.05199 17.7549 3.15346C17.9996 3.25493 18.2218 3.40365 18.409 3.59112V3.59012Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
              </button>
            )}
            {isOwner && (
              <button onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6 19C6 19.5304 6.21071 20.0391 6.58579 20.4142C6.96086 20.7893 7.46957 21 8 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19V7H6V19ZM8 9H16V19H8V9ZM15.5 4L14.5 3H9.5L8.5 4H5V6H19V4H15.5Z" fill="black"/>
</svg>

              </button>
            )}
            <div onClick={handleRetweet} className="flex items-center gap-1 cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 7l-3-3v2H3v2h17v2l3-3zm-3 10H3v-2h17v-2l3 3-3 3v-2z" fill="currentColor"/>
              </svg>
              <span className="text-white">{retweetCount}</span>
            </div>
            {/* Affichage du bouton Répondre uniquement si le post n'est pas verrouillé */}
            {!isLockedState && (
              <button
                onClick={() => setShowReplyForm((prev) => !prev)}
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                title="Répondre"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.2L4 17.2V4H20V16Z" fill="white"/>
</svg>

              </button>
            )}
            {isOwner && (
              isLockedState ? (
                <button onClick={handleUnlock} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition">
                  <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clipPath="url(#clip0_410_1372)">
<path d="M0 22C0 22.5304 0.210714 23.0391 0.585786 23.4142C0.960859 23.7893 1.46957 24 2 24H18C18.5304 24 19.0391 23.7893 19.4142 23.4142C19.7893 23.0391 20 22.5304 20 22V12C20 11.4695 19.7893 10.9608 19.4142 10.5858C19.0391 10.2107 18.5304 9.99998 18 9.99998H6V6.49998C6 5.43911 6.42143 4.4217 7.17157 3.67155C7.92172 2.9214 8.93913 2.49998 10 2.49998C11.0609 2.49998 12.0783 2.9214 12.8284 3.67155C13.5786 4.4217 14 5.43911 14 6.49998V6.78198C14 7.1135 14.1317 7.43144 14.3661 7.66586C14.6005 7.90028 14.9185 8.03198 15.25 8.03198C15.5815 8.03198 15.8995 7.90028 16.1339 7.66586C16.3683 7.43144 16.5 7.1135 16.5 6.78198V6.74898V6.75098V6.50098C16.5 4.77707 15.8152 3.12377 14.5962 1.90478C13.3772 0.685796 11.7239 0.000976563 10 0.000976562C8.27609 0.000976563 6.62279 0.685796 5.40381 1.90478C4.18482 3.12377 3.5 4.77707 3.5 6.50098V10.001H2C1.46957 10.001 0.960859 10.2117 0.585786 10.5868C0.210714 10.9618 0 11.4705 0 12.001L0 22ZM8 15.5C8.00007 15.1535 8.09016 14.813 8.26143 14.5118C8.43269 14.2106 8.67927 13.9591 8.97699 13.7818C9.27472 13.6046 9.61337 13.5078 9.95978 13.5008C10.3062 13.4938 10.6485 13.577 10.9531 13.7421C11.2577 13.9072 11.5142 14.1486 11.6974 14.4427C11.8807 14.7367 11.9844 15.0734 11.9984 15.4196C12.0124 15.7658 11.9362 16.1097 11.7773 16.4176C11.6184 16.7255 11.3823 16.9868 11.092 17.176L11.084 17.181C11.084 17.181 11.279 18.361 11.499 19.751V19.752C11.4987 19.9505 11.4197 20.1409 11.2793 20.2813C11.1389 20.4217 10.9486 20.5007 10.75 20.501H9.248C9.04943 20.5007 8.85908 20.4217 8.71867 20.2813C8.57826 20.1409 8.49926 19.9505 8.499 19.752V19.751L8.914 17.181C8.63309 16.9998 8.40207 16.7511 8.24205 16.4576C8.08203 16.1642 7.99813 15.8352 7.998 15.501L8 15.5Z" fill="black"/>
</g>
<defs>
<clipPath id="clip0_410_1372">
<rect width="20" height="24" fill="white"/>
</clipPath>
</defs>
</svg>

                </button>
              ) : (
                <button onClick={handleLock} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition">
                  <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clipPath="url(#clip0_410_1374)">
<path d="M3.5 6.5V10H2C1.46957 10 0.960859 10.2107 0.585786 10.5858C0.210714 10.9609 0 11.4696 0 12L0 22C0 22.5304 0.210714 23.0391 0.585786 23.4142C0.960859 23.7893 1.46957 24 2 24H18C18.5304 24 19.0391 23.7893 19.4142 23.4142C19.7893 23.0391 20 22.5304 20 22V12C20 11.4696 19.7893 10.9609 19.4142 10.5858C19.0391 10.2107 18.5304 10 18 10H16.5V6.5C16.5 4.77609 15.8152 3.12279 14.5962 1.90381C13.3772 0.684819 11.7239 0 10 0C8.27609 0 6.62279 0.684819 5.40381 1.90381C4.18482 3.12279 3.5 4.77609 3.5 6.5ZM6 10V6.5C6 5.43913 6.42143 4.42172 7.17157 3.67157C7.92172 2.92143 8.93913 2.5 10 2.5C11.0609 2.5 12.0783 2.92143 12.8284 3.67157C13.5786 4.42172 14 5.43913 14 6.5V10H6ZM8 15.5C8.00007 15.1535 8.09016 14.813 8.26143 14.5118C8.43269 14.2106 8.67927 13.9591 8.97699 13.7819C9.27472 13.6046 9.61337 13.5078 9.95978 13.5008C10.3062 13.4939 10.6485 13.577 10.9531 13.7421C11.2577 13.9072 11.5142 14.1486 11.6974 14.4427C11.8807 14.7368 11.9844 15.0734 11.9984 15.4196C12.0124 15.7658 11.9362 16.1097 11.7773 16.4176C11.6184 16.7255 11.3823 16.9868 11.092 17.176L11.084 17.181C11.084 17.181 11.279 18.361 11.499 19.751V19.752C11.4987 19.9506 11.4197 20.1409 11.2793 20.2813C11.1389 20.4217 10.9486 20.5007 10.75 20.501H9.248C9.04943 20.5007 8.85908 20.4217 8.71867 20.2813C8.57826 20.1409 8.49926 19.9506 8.499 19.752V19.751L8.914 17.181C8.63309 16.9998 8.40207 16.7511 8.24205 16.4577C8.08203 16.1642 7.99813 15.8353 7.998 15.501L8 15.5Z" fill="black"/>
</g>
<defs>
<clipPath id="clip0_410_1374">
<rect width="20" height="24" fill="white"/>
</clipPath>
</defs>
</svg>

                </button>
              )
            )}
          </div>
          {showReplyForm && !isLockedState && (
            <div className="mt-2">
              <textarea
                className="w-full bg-gray-800 text-white outline-none resize-none p-2"
                placeholder="Votre réponse..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
              <div className="mt-1 flex gap-2">
                <button onClick={handleReplySubmit} className="px-3 py-1 bg-green-500 text-white rounded">
                  Répondre
                </button>
                <button onClick={() => setShowReplyForm(false)} className="px-3 py-1 bg-gray-500 text-white rounded">
                  Annuler
                </button>
              </div>
            </div>
          )}
          {actionError && <p className="text-red-500 mt-2">{actionError}</p>}
          {localReplies.length > 0 && !isLockedState && (
            <div className="mt-4 pl-8 border-l border-gray-600">
              {localReplies.map((reply, index) => (
                <div key={reply.id || index} className="mb-2">
                  <div className="flex items-center gap-2">
                    <img src={reply.profilePicture} alt={reply.username} className="w-6 h-6 rounded-full" />
                    <span className="text-white font-semibold">{reply.username}</span>
                    <span className="text-gray-400 text-xs">{reply.createdAt}</span>
                  </div>
                  <p className="text-gray-300">{reply.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default Tweet;
