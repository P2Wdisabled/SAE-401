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

  // Retrieve settings via GET
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

  // Update settings via PUT
  const handleSubmit = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User not authenticated.");
      return;
    }
    updateProfileSettings(token, { readOnly, private: privateAccount })
      .then(() => {
        setSuccess("Settings updated successfully.");
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
      <h2 className="text-2xl mb-4">Settings</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {success && <p className="text-green-500 mb-2">{success}</p>}
      <CheckboxField
        label="Read-only mode"
        description="When enabled, no one will be able to comment or reply to your content."
        checked={readOnly}
        onChange={(e) => setReadOnly(e.target.checked)}
      />
      <CheckboxField
        label="Private account"
        description="When enabled, any new follow request will require your approval. Only approved followers will have access to your tweets. Additionally, content from a private account cannot be retweeted."
        checked={privateAccount}
        onChange={(e) => setPrivateAccount(e.target.checked)}
      />
      <Button
        text={loading ? "Updating..." : "Save"}
        onClick={handleSubmit}
        variant="primary"
        size="small"
      />
    </div>
  );
}

export default Settings;
