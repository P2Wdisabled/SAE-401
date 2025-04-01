// src/pages/Settings.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { useCheckToken } from "../components/Checker";

function Settings() {
  useCheckToken();
  const navigate = useNavigate();
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const [privateAccount, setPrivateAccount] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Récupérer les paramètres actuels via GET
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    fetch("http://localhost:8080/api/profile/settings", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    })
      .then((res) =>
        res.json().then((data) => {
          if (!res.ok) {
            throw new Error(data.error || "Erreur lors du chargement des paramètres");
          }
          return data;
        })
      )
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

  // Mettre à jour les paramètres via PUT
  const handleSubmit = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Utilisateur non authentifié.");
      return;
    }
    fetch("http://localhost:8080/api/profile/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify({
        readOnly: readOnly,
        private: privateAccount,
      }),
    })
      .then((res) =>
        res.json().then((data) => {
          if (!res.ok) {
            throw new Error(data.error || "Erreur lors de la mise à jour des paramètres");
          }
          return data;
        })
      )
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
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={readOnly}
            onChange={(e) => setReadOnly(e.target.checked)}
            className="mr-2"
          />
          Mode lecture seule
        </label>
        <p className="text-sm text-gray-400">
          Lorsque activé, personne ne pourra commenter ou répondre à vos contenus.
        </p>
      </div>
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={privateAccount}
            onChange={(e) => setPrivateAccount(e.target.checked)}
            className="mr-2"
          />
          Compte privé
        </label>
        <p className="text-sm text-gray-400">
          Lorsque activé, seuls vos abonnés pourront voir vos contenus.
        </p>
      </div>
      <Button
        text={loading ? "Mise à jour..." : "Sauvegarder"}
        onClick={handleSubmit}
        moreClasses="bg-blue-500 text-white px-4 py-2 rounded"
      />
    </div>
  );
}

export default Settings;
