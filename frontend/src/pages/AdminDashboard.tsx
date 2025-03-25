import React, { useState } from "react";
import { Link } from "react-router-dom";
import AccountsList from "../components/AccountsList";
import {checkToken, checkAdmin} from "../components/Checker"; // Adapté selon votre arborescence
import Button from "../ui/Button";

function Dashboard() {
  checkAdmin();



  return (
    <>
      {/* Liste des tweets */}
      <AccountsList />
    </>
  );
}

export default Dashboard;
