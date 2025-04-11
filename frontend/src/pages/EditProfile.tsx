import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import FormInput from "../ui/FormInput";
import FormTextarea from "../ui/FormTextarea";
import Button from "../ui/Button";
import { uploadFile } from "../api/uploadFile";
import { getProfileEdit } from "../api/getProfileEdit";
import { updateProfile } from "../api/updateProfile";

const EditProfile: React.FC = () => {
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [banner, setBanner] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Fonction d'upload d'un fichier
  const handleUploadFile = async (file: File, setter: (url: string) => void) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const url = await uploadFile(file, token);
      setter(url);
    } catch (error) {
      console.error(error);
    }
  };

  // Dropzone pour la photo de profil
  const onDropProfile = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    handleUploadFile(file, setProfilePicture);
  }, []);

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
  const onDropBanner = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    handleUploadFile(file, setBanner);
  }, []);

  const {
    getRootProps: getBannerRootProps,
    getInputProps: getBannerInputProps,
    isDragActive: isBannerDragActive,
  } = useDropzone({
    onDrop: onDropBanner,
    accept: "image/*",
    multiple: false,
  });

  // Récupération des infos actuelles du profil
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    getProfileEdit(token)
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

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    const payload = { bio, profilePicture, banner, location, website };
    try {
      await updateProfile(token, payload);
      setMessage("Profil mis à jour avec succès.");
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (error: any) {
      console.error(error);
      setMessage(error.message || "Erreur lors de la mise à jour.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-white mb-4">Modifier le profil</h1>
      {message && <p className="text-green-500 mb-4">{message}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* On fixe la largeur en passant la variante "full" */}
        <FormInput
          label="Bio"
          type="text"
          size="full"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
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
          size="full"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <FormInput
          label="Site web"
          type="url"
          size="full"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        {/* Bouton sans passage de moreClasses, on utilise la variante "primary" */}
        <Button text="Enregistrer" buttonType="submit" variant="primary" />
      </form>
    </div>
  );
};

export default EditProfile;
