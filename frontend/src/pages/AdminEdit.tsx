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

  const { id } = useParams<{ id: string }>(); // The ID is a string

  // States to store user information and query status
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Retrieve user information by id using the getUser module
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
        setError("Error retrieving the user.");
      });
  }, [id]);

  // Function to update the user using the updateUser module
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    if (!token || !id) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }
    const payload = { username, email };
    try {
      await updateUser(token, id, payload);
      setSuccess("User updated successfully.");
    } catch (err) {
      console.error(err);
      setError("Error updating the user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-white mb-4">Edit Account: {id}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      <FormInput
        label="Username"
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
      <Button text="Confirm changes" onClick={handleSubmit} />
      {loading && <p className="text-white mt-4">Updating...</p>}
    </div>
  );
}

export default AdminEdit;
