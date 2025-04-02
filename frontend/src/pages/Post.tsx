import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCheckToken } from "../components/Checker";
import Button from "../ui/Button";

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

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setText(newValue.slice(0, 280));
  };

  const uploadMediaFile = async (file: File): Promise<string> => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("http://localhost:8080/api/upload", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Erreur lors de l'upload");
    }
    const data = await response.json();
    return data.url;
  };

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

    for (let i = 0; i < newMediaFiles.length; i++) {
      try {
        const url = await uploadMediaFile(newMediaFiles[i].file);
        newMediaFiles[i].uploadedUrl = url;
        setMediaFiles([...newMediaFiles]);
      } catch (error) {
        console.error("Erreur lors de l'upload :", error);
      }
    }
  };

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
      const response = await fetch("http://localhost:8080/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        body: JSON.stringify({
          content: text,
          media: mediaFiles.map((file) => file.uploadedUrl).filter((url) => url !== null),
          locked: locked
        }),
      });
      const data = await response.json();
      if (response.ok) {
        navigate("/");
      } else if (data.errors) {
        const allErrors = Object.values(data.errors).join(" ");
        setError(allErrors);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("Une erreur inconnue est survenue.");
      }
    } catch (err) {
      console.error("Erreur lors de la requête :", err);
      setError("Erreur réseau, veuillez réessayer plus tard.");
    }
  };

  return (
    <div className="bg-[#17202A] min-h-screen text-white flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-gray-700">
        <Button page="/" text="&#10005;" bg="transparent" moreClasses="text-2xl hover:bg-gray-800 p-2 rounded-full" />
        <Button
          text="Poster"
          bg="bg-primary"
          moreClasses="px-4 py-2 rounded-full font-semibold hover:bg-[#1A91DA] transition"
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
            <label htmlFor="media-upload" className="cursor-pointer inline-block bg-gray-700 p-2 rounded">
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
              <div key={index} className="w-32 h-32 border border-gray-600 flex items-center justify-center">
                {media.file.type.startsWith("image") ? (
                  <img src={media.preview} alt={`preview-${index}`} className="object-cover w-full h-full" />
                ) : media.file.type.startsWith("video") ? (
                  <video src={media.preview} controls className="object-cover w-full h-full" />
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
