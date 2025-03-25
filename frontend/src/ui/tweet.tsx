import React from "react";

type TweetProps = {
  author: string;
  content: string;
  avatarColor: string; // Permet de changer la couleur de l'avatar (ex: "bg-gray-400")
};

function Tweet({ author, content, avatarColor }: TweetProps) {
  return (
    <article className="flex items-start gap-3 py-3 border-b border-gray-600">
      {/* Avatar simulé par un cercle coloré */}
      <div className={`rounded-full w-10 h-10 ${avatarColor}`} />

      {/* Zone de texte */}
      <div>
        <p className="text-white font-semibold">{author}</p>
        <p className="text-gray-300">{content}</p>
      </div>
    </article>
  );
}

export default Tweet;