// src/pages/Dashboard.tsx
import React from "react";
import AccountsList from "../components/AccountsList";
import { useCheckToken } from "../components/Checker";
import Button from "../ui/Button";

function Dashboard() {
  useCheckToken();

  return (
    <div className="p-4">
      <h2 className="text-2xl text-white mb-4">Dashboard Admin</h2>
      <AccountsList />
      {/* Bouton pour accéder à la page /admin/censor */}
      <div className="mb-4 flex justify-end">
        <Button page="/admin/censor" text="Censurer" variant="outline" />
      </div>
    </div>
  );
}

export default Dashboard;
