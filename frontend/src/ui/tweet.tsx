
// src/ui/tweet.tsx
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
  censored?: boolean; // Indique si le tweet est censuré
  media?: string[];   // URLs des médias associés
  replies?: any[];    // Réponses au tweet
  onDelete?: () => void;
};

// Fonction pour analyser et transformer le texte en incluant les hashtags et mentions cliquables
const parseContent = (text: string): React.ReactNode[] => {
  // Regex pour détecter hashtags et mentions
  const regex = /(\B#[a-zA-Z0-9_]+)|(\B@[a-zA-Z0-9_]+)/g;
  // Découper le texte en segments
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (!part) return null;
    if (part.startsWith("#")) {
      // Hashtag : redirige vers /hashtag/{tag}
      const tag = part.substring(1);
      return (
        <Link key={index} to={`/hashtag/${tag}`} className="text-blue-400 hover:underline">
          {part}
        </Link>
      );
    } else if (part.startsWith("@")) {
      // Mention : redirige vers /profile/{username}
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
  initialLiked,
  censored = false,
  media = [],
  replies = [],
  isOwner,
  onDelete,
}) => {
  const [liked, setLiked] = useState<boolean>(initialLiked);
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>(content);
  const [editMedia, setEditMedia] = useState<string[]>(media);
  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);
  const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
  const [replyContent, setReplyContent] = useState<string>("");
  const [localReplies, setLocalReplies] = useState<any[]>(replies);
  const [actionError, setActionError] = useState<string>("");
  const navigate = useNavigate();

  // Fonction pour toggler le like
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


  

  // Fonction pour supprimer le tweet
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
        const data = await response.json();
        setActionError(data.error || "Erreur lors de la suppression du tweet");
        return;
      }
      if (onDelete) {
        onDelete();
      }
      setActionError("");
    } catch (error) {
      console.error("Erreur lors de la suppression du tweet", error);
      setActionError("Erreur lors de la suppression du tweet");
    }
  };

  // Fonction pour sauvegarder les modifications d'édition
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
        body: JSON.stringify({
          content: editContent,
          media: updatedMedia,
        }),
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

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditContent(content);
    setEditMedia(media);
    setNewMediaFiles([]);
    setIsEditing(false);
    setActionError("");
  };

  // Gestion du changement de nouveaux fichiers médias
  const handleNewMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewMediaFiles((prev) => [...prev, ...files]);
    }
  };

  // Supprimer un média existant lors de l'édition
  const removeExistingMedia = (url: string) => {
    setEditMedia((prev) => prev.filter((mediaUrl) => mediaUrl !== url));
  };

  // Supprimer un nouveau média (non encore uploadé)
  const removeNewMedia = (file: File) => {
    setNewMediaFiles((prev) => prev.filter((f) => f !== file));
  };

  // Envoi d'une réponse
  const handleReplySubmit = async () => {
    if (replyContent.trim() === "") return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:8080/api/posts/${tweetId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        body: JSON.stringify({
          content: replyContent,
          media: [],
        }),
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
              {/* Si le tweet est censuré, le contenu s'affiche en italique */}
              <p className={`text-gray-300 ${censored ? "italic" : ""}`}>
                {parseContent(content)}
              </p>
              {/* N'afficher pas les médias si le post est censuré */}
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
            // Bloc édition (inchangé)
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
                Modifier
              </button>
            )}
            {isOwner && (
              <button onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition">
                Supprimer
              </button>
            )}
            <button
              onClick={() => setShowReplyForm((prev) => !prev)}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
              title="Répondre"
            >
              💬
            </button>
          </div>
          {showReplyForm && (
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
          {localReplies.length > 0 && (
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
