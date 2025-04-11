// src/components/Home.tsx
import React, { useState } from "react";
import TweetList from "../components/TweetList";
import { useCheckToken } from "../components/Checker";
import Button from "../ui/Button";

function Home() {
  useCheckToken();
  // Active tab: "pourVous" or "abonnements"
  const [activeTab, setActiveTab] = useState<"pourVous" | "abonnements">("pourVous");

  // Handles the click on the tabs
  const handleTabClick = (tab: "pourVous" | "abonnements") => {
    setActiveTab(tab);
  };

  return (
    <>
      {/* Tab bar */}
      <nav className="flex justify-evenly border-b border-gray-700 text-white relative">
        <button
          className={`py-2 ${activeTab === "pourVous" ? "text-white" : "text-gray-400"}`}
          onClick={() => handleTabClick("pourVous")}
        >
          For you
          {/* Blue bar under the active tab */}
          {activeTab === "pourVous" && (
            <span className="absolute left-0 w-1/2 bottom-0 h-[3px] bg-[#1DA1F2] transition"></span>
          )}
        </button>
        <button
          className={`py-2 ${activeTab === "abonnements" ? "text-white" : "text-gray-400"}`}
          onClick={() => handleTabClick("abonnements")}
        >
          Subscriptions
          {activeTab === "abonnements" && (
            <span className="absolute right-0 w-1/2 bottom-0 h-[3px] bg-[#1DA1F2] transition"></span>
          )}
        </button>
      </nav>

      {/* Tweet list */}
      <TweetList activeTab={activeTab} />

      {/* Floating button (new Tweet) */}
      <Button text="+" page="/post" variant="floating" />
    </>
  );
}

export default Home;
