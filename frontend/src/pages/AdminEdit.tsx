// src/pages/AdminEdit.tsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCheckToken } from "../components/Checker";
import Button from "../ui/Button";
import FormInput from "../ui/FormInput";
import { getUser } from "../api/getUser";
import { updateUser } from "../api/updateUser";

function AdminEdit() {
  useCheckToken();

  const { id } = useParams<{ id: string }>(); // L'ID est une chaîne de caractères

  // États pour stocker les informations de l'utilisateur et le statut de la requête
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Récupérer les informations de l'utilisateur par son id via le module getUser
  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    getUser(token, id)
      .then((data) => {
        setUsername(data.username);
        setEmail(data.email);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError("Erreur lors de la récupération de l'utilisateur.");
      });
  }, [id]);

  // Fonction pour mettre à jour l'utilisateur via le module updateUser
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    if (!token || !id) {
      setError("Utilisateur non authentifié.");
      setLoading(false);
      return;
    }
    const payload = { username, email };
    try {
      await updateUser(token, id, payload);
      setSuccess("Utilisateur mis à jour avec succès.");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la mise à jour de l'utilisateur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-white mb-4">Modification du compte : {id}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      <FormInput
        label="Nom d'utilisateur"
        type="text"
        value={username}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
      />
      <FormInput
        label="Email"
        type="email"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
      />
      <Button text="Confirmer les modifications" onClick={handleSubmit} />
      {loading && <p className="text-white mt-4">Mise à jour en cours...</p>}
    </div>
  );
}

export default AdminEdit;
