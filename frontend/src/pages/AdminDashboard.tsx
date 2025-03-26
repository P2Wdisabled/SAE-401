import React from "react";
import AccountsList from "../components/AccountsList";
import {useCheckToken} from "../components/Checker";

function Dashboard() {
  useCheckToken();



  return (
    <>
      {/* Liste des tweets */}
      <AccountsList />
    </>
  );
}

export default Dashboard;
