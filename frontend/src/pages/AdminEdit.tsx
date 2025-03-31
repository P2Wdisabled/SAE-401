// src/pages/AdminEdit.tsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCheckToken } from "../components/Checker";
import Button from "../ui/Button";
import FormInput from "../ui/FormInput";

function EditAccount() {
  useCheckToken();

  const { id } = useParams<{ id: string }>(); // id est une chaîne de caractères

  // États pour stocker les informations de l'utilisateur et le statut de la requête
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Récupérer les informations de l'utilisateur par son id
  useEffect(() => {
    if (id) {
      fetch(`http://localhost:8080/users/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token"),
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erreur lors de la récupération de l'utilisateur");
          }
          return response.json();
        })
        .then((data) => {
          setUsername(data.username);
          setEmail(data.email);
        })
        .catch((err) => {
          console.error(err);
          setError("Erreur lors de la récupération de l'utilisateur.");
        });
    }
  }, [id]);

  // Fonction pour mettre à jour l'utilisateur
  const handleSubmit = () => {
    setLoading(true);
    setError("");
    setSuccess("");
    fetch(`http://localhost:8080/users/${id}`, {
      method: "PUT", // ou "PATCH" selon votre API
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        username: username,
        email: email,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour de l'utilisateur");
        }
        return response.json();
      })
      .then(() => {
        setSuccess("Utilisateur mis à jour avec succès.");
      })
      .catch((err) => {
        console.error(err);
        setError("Erreur lors de la mise à jour de l'utilisateur.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="p-4">
      <h2 className="text-white mb-4">Modification du compte : {id}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      <FormInput
        label={username}
        type="text"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setUsername(e.target.value)
        }
      />
      <FormInput
        label={email}
        type="email"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setEmail(e.target.value)
        }
      />
      <Button text="Confirmer les modifications" onClick={handleSubmit} />
      {loading && <p className="text-white mt-4">Mise à jour en cours...</p>}
    </div>
  );
}

export default EditAccount;
