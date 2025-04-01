// src/pages/Dashboard.tsx
import React from "react";
import AccountsList from "../components/AccountsList";
import { useCheckToken } from "../components/Checker";

function Dashboard() {
  useCheckToken();

  return (
    <div className="p-4">
      <h2 className="text-2xl text-white mb-4">Dashboard Admin</h2>
      <AccountsList />
    </div>
  );
}

export default Dashboard;
