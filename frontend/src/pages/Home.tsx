import React, { useState } from "react";
import TweetList from "../components/TweetList";
import {useCheckToken} from "../components/Checker"; // Adapté selon votre arborescence
import Button from "../ui/Button";

function Home() {
  useCheckToken();
  // Onglet actif : "pourVous" ou "abonnements"
  const [activeTab, setActiveTab] = useState<"pourVous" | "abonnements">("pourVous");

  // Gère le clic sur les onglets
  function handleTabClick(tab: "pourVous" | "abonnements") {
    setActiveTab(tab);
  }

  return (
    
    <>
      {/* Barre d'onglets */}
      <nav className="flex justify-evenly border-b border-gray-700 text-white relative">
        <button
          className={`py-2 ${activeTab === "pourVous" ? "text-white" : "text-gray-400"}`}
          onClick={() => handleTabClick("pourVous")}
        >
          Pour vous
          {/* Barre bleue sous l'onglet actif */}
          {activeTab === "pourVous" && (
            <span className="absolute left-0 w-1/2 bottom-0 h-[3px] bg-[#1DA1F2] transition"></span>
          )}
        </button>
        {/* <button
          className={`py-2 ${activeTab === "abonnements" ? "text-white" : "text-gray-400"}`}
          onClick={() => handleTabClick("abonnements")}
        >
          Abonnements
          {activeTab === "abonnements" && (
            <span className="absolute right-0 w-1/2 bottom-0 h-[3px] bg-[#1DA1F2] transition"></span>
          )}
        </button> */}
      </nav>

      {/* Liste des tweets */}
      <TweetList activeTab={activeTab} />

      {/* Bouton flottant (nouveau Tweet) */}
      <Button text="+" page="/post" moreClasses="w-12 h-12 rounded-full bg-[#1DA1F2] text-white text-2xl 
                   flex items-center justify-center 
                   absolute bottom-8 right-8 
                   hover:bg-[#1A91DA] transition" />
    </>
  );
}

export default Home;
