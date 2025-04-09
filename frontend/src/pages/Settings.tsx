// src/components/Settings.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import CheckboxField from "../ui/CheckboxField";
import { useCheckToken } from "../components/Checker";
import { getProfileSettings } from "../api/getProfileSettings";
import { updateProfileSettings } from "../api/updateProfileSettings";

function Settings() {
  const navigate = useNavigate();
  useCheckToken();
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const [privateAccount, setPrivateAccount] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Récupération des paramètres via GET
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    getProfileSettings(token)
      .then((data) => {
        setReadOnly(data.readOnly);
        setPrivateAccount(data.private);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  }, [navigate]);

  // Mise à jour des paramètres via PUT
  const handleSubmit = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Utilisateur non authentifié.");
      return;
    }
    updateProfileSettings(token, { readOnly, private: privateAccount })
      .then(() => {
        setSuccess("Paramètres mis à jour avec succès.");
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setSuccess("");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-gray-800 text-white rounded">
      <h2 className="text-2xl mb-4">Paramètres</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {success && <p className="text-green-500 mb-2">{success}</p>}
      <CheckboxField
        label="Mode lecture seule"
        description="Lorsque activé, personne ne pourra commenter ou répondre à vos contenus."
        checked={readOnly}
        onChange={(e) => setReadOnly(e.target.checked)}
      />
      <CheckboxField
        label="Compte privé"
        description="Lorsque activé, toute nouvelle demande de suivi nécessitera votre approbation. Seuls les abonnés approuvés auront accès à vos tweets. De plus, les contenus d’un compte privé ne pourront pas être retweetés."
        checked={privateAccount}
        onChange={(e) => setPrivateAccount(e.target.checked)}
      />
      <Button
        text={loading ? "Mise à jour..." : "Sauvegarder"}
        onClick={handleSubmit}
        moreClasses="bg-blue-500 text-white px-4 py-2 rounded"
      />
    </div>
  );
}

export default Settings;
