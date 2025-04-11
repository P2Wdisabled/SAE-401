// src/components/Post.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCheckToken } from "../components/Checker";
import Button from "../ui/Button";
import { uploadMediaFile } from "../api/uploadMedia";
import { createPost } from "../api/createPost";

interface MediaFile {
  file: File;
  preview: string;
  uploadedUrl: string | null;
}

function Post() {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [locked, setLocked] = useState<boolean>(false);
  useCheckToken();
  const navigate = useNavigate();

  // Limiter le nombre de caractères à 280
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setText(newValue.slice(0, 280));
  };

  // Gérer le changement des fichiers médias et déclencher leur upload
  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    const filesArray = Array.from(selectedFiles);
    const newMediaFiles: MediaFile[] = filesArray.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploadedUrl: null,
    }));
    setMediaFiles(newMediaFiles);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Utilisateur non authentifié.");
      return;
    }

    // Upload de chaque fichier et mise à jour de l’état
    for (let i = 0; i < newMediaFiles.length; i++) {
      try {
        const url = await uploadMediaFile(newMediaFiles[i].file, token);
        newMediaFiles[i].uploadedUrl = url;
        setMediaFiles([...newMediaFiles]);
      } catch (err) {
        console.error("Erreur lors de l'upload :", err);
      }
    }
  };

  // Gérer la soumission du post
  const handleSubmit = async () => {
    if (text.trim().length === 0) {
      setError("Le post ne peut pas être vide.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Utilisateur non authentifié.");
      return;
    }
    try {
      const mediaUrls = mediaFiles
        .map((file) => file.uploadedUrl)
        .filter((url): url is string => url !== null);
      await createPost(text, mediaUrls, locked, token);
      navigate("/");
    } catch (err: any) {
      console.error("Erreur lors de la requête :", err);
      setError(err.message || "Erreur réseau, veuillez réessayer plus tard.");
    }
  };

  return (
    <div className="bg-[#17202A] min-h-screen text-white flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-gray-700">
        {/* Bouton de fermeture avec la variante "icon" */}
        <Button
          page="/"
          text="&#10005;"
          variant="icon"
        />
        {/* Bouton pour poster avec la variante "primary" et taille "small" */}
        <Button
          text="Poster"
          variant="primary"
          size="small"
          onClick={handleSubmit}
        />
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-gray-600 p-2 relative">
          <textarea
            className="w-full h-64 bg-transparent text-white outline-none resize-none placeholder-gray-400"
            placeholder="Quoi de neuf ?"
            maxLength={280}
            value={text}
            onChange={handleChange}
          />
          <span className="absolute top-2 right-2 text-sm text-gray-400">
            {text.length}/280
          </span>

          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="lock-tweet"
              checked={locked}
              onChange={(e) => setLocked(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="lock-tweet">Verrouiller le tweet</label>
          </div>

          <div className="mt-4">
            <label
              htmlFor="media-upload"
              className="cursor-pointer inline-block bg-gray-700 p-2 rounded"
            >
              Sélectionner des fichiers
            </label>
            <input
              id="media-upload"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaChange}
              className="hidden"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            {mediaFiles.map((media, index) => (
              <div
                key={index}
                className="w-32 h-32 border border-gray-600 flex items-center justify-center"
              >
                {media.file.type.startsWith("image") ? (
                  <img
                    src={media.preview}
                    alt={`preview-${index}`}
                    className="object-cover w-full h-full"
                  />
                ) : media.file.type.startsWith("video") ? (
                  <video
                    src={media.preview}
                    controls
                    className="object-cover w-full h-full"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
    </div>
  );
}

export default Post;
