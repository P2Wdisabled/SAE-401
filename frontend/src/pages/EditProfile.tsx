import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import FormInput from "../ui/FormInput";
import FormTextarea from "../ui/FormTextarea"; // Créez ce composant si nécessaire
import Button from "../ui/Button";

const EditProfile: React.FC = () => {
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [banner, setBanner] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Fonction pour uploader un fichier et récupérer son URL via l'endpoint /api/upload
  const uploadFile = async (file: File): Promise<string> => {
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

  // Dropzone pour la photo de profil
  const onDropProfile = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      uploadFile(file)
        .then((url) => {
          setProfilePicture(url);
        })
        .catch((error) => console.error(error));
    },
    []
  );
  const {
    getRootProps: getProfileRootProps,
    getInputProps: getProfileInputProps,
    isDragActive: isProfileDragActive,
  } = useDropzone({
    onDrop: onDropProfile,
    accept: "image/*",
    multiple: false,
  });

  // Dropzone pour la bannière
  const onDropBanner = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      uploadFile(file)
        .then((url) => {
          setBanner(url);
        })
        .catch((error) => console.error(error));
    },
    []
  );
  const {
    getRootProps: getBannerRootProps,
    getInputProps: getBannerInputProps,
    isDragActive: isBannerDragActive,
  } = useDropzone({
    onDrop: onDropBanner,
    accept: "image/*",
    multiple: false,
  });

  // Récupération des informations actuelles du profil via le token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    fetch("http://localhost:8080/api/profile/edit", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur lors du chargement des informations du profil");
        }
        return res.json();
      })
      .then((data) => {
        const profileData = data.profile;
        setBio(profileData.bio || "");
        setProfilePicture(profileData.profilePicture || "");
        setBanner(profileData.banner || "");
        setLocation(profileData.location || "");
        setWebsite(profileData.website || "");
      })
      .catch((err) => console.error(err));
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const payload = { bio, profilePicture, banner, location, website };
    try {
      const response = await fetch("http://localhost:8080/api/profile/edit", {
        method: "PUT",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setMessage("Profil mis à jour avec succès.");
        setTimeout(() => {
          navigate(-1); // Retour à la page précédente
        }, 2000);
      } else {
        const data = await response.json();
        setMessage(data.error || "Erreur lors de la mise à jour.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors de la requête.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-white mb-4">Modifier le profil</h1>
      {message && <p className="text-green-500 mb-4">{message}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormInput
          label="Bio"
          type="text"
          moreClasses="w-full"
          value={bio}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBio(e.target.value)}
        />
        {/* Zone de drop pour la photo de profil */}
        <div
          {...getProfileRootProps()}
          className="border-dashed border-2 p-4 text-center cursor-pointer border-gray-500"
        >
          <input {...getProfileInputProps()} />
          {isProfileDragActive ? (
            <p>Déposez l'image de profil ici...</p>
          ) : (
            <p>Glissez-déposez ou cliquez pour uploader votre photo de profil</p>
          )}
          {profilePicture && (
            <img
              src={profilePicture}
              alt="Prévisualisation de la photo de profil"
              className="mt-2 w-24 h-24 rounded-full mx-auto"
            />
          )}
        </div>
        {/* Zone de drop pour la bannière */}
        <div
          {...getBannerRootProps()}
          className="border-dashed border-2 p-4 text-center cursor-pointer border-gray-500"
        >
          <input {...getBannerInputProps()} />
          {isBannerDragActive ? (
            <p>Déposez la bannière ici...</p>
          ) : (
            <p>Glissez-déposez ou cliquez pour uploader votre bannière</p>
          )}
          {banner && (
            <img
              src={banner}
              alt="Prévisualisation de la bannière"
              className="mt-2 w-full h-32 object-cover"
            />
          )}
        </div>
        <FormInput
          label="Localisation"
          type="text"
          value={location}
          moreClasses="w-full"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
        />
        <FormInput
          label="Site web"
          type="url"
          value={website}
          moreClasses="w-full"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebsite(e.target.value)}
        />
        <Button
          text="Enregistrer"
          buttonType="submit"
          bg="bg-blue-500"
          moreClasses="text-white px-4 py-2 rounded"
        />
      </form>
    </div>
  );
};

export default EditProfile;
