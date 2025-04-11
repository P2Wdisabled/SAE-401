import React from "react";
import { Link } from "react-router-dom";

type ButtonProps = {
  page?: string;
  text?: string;
  bg?: string;
  buttonType?: "button" | "submit" | "reset";
  moreClasses?: string;
  object?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

function Button({
  page = "",
  text = "",
  bg = "bg-primary",
  buttonType = "button",
  moreClasses = "",
  object,
  onClick,
}: ButtonProps) {
  const classes = `${bg} px-6 py-3 rounded-full font-semibold transition ${moreClasses}`;

  // On affiche le texte et, s'il existe, l'objet (par exemple un SVG)
  const content = (
    <>
      {text}
      {object && <span className="">{object}</span>}
    </>
  );

  if (!page) {
    return (
      <button type={buttonType} className={classes} onClick={onClick}>
        {content}
      </button>
    );
  } else {
    return (
      <Link to={page}>
        <button type={buttonType} className={classes} onClick={onClick}>
          {content}
        </button>
      </Link>
    );
  }
}

export default Button;
