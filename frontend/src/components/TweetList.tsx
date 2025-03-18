// src/components/TweetList.tsx
import React from "react";
import Tweet from "../ui/tweet";

type TweetListProps = {
  activeTab: "pourVous" | "abonnements";
};

function TweetList({ activeTab }: TweetListProps) {
  // Exemples de tweets différents selon l'onglet
  if (activeTab === "pourVous") {
    return (
      <main className="px-4 pb-16">
        <Tweet
          author="Unnamed"
          content="Wow j'adore faire des réseaux sociaux de 0, c'est trop bien, je m'amuse de fou !!"
          avatarColor="bg-gray-400"
        />
        <Tweet
          author="Ptwo"
          content="c’est marrant les gens qui parlent de leur vie ici, ils font que mentir mdr ! @Mora @Springsifeld Regardez ça!"
          avatarColor="bg-red-500"
        />
      </main>
    );
  } else {
    // Onglet "Abonnements"
    return (
      <main className="px-4 pb-16">
        <Tweet
          author="MonMeilleurAmi"
          content="Salut les amis, abonnez-vous pour plus de contenu exclusif !"
          avatarColor="bg-blue-500"
        />
        <Tweet
          author="DevReact"
          content="Voici des astuces pour coder plus vite en React !"
          avatarColor="bg-green-500"
        />
      </main>
    );
  }
}

export default TweetList;
