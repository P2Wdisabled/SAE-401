import React from "react";
import { Link } from "react-router-dom";
import { cva, VariantProps } from "class-variance-authority";

// Définition des classes du bouton avec variantes
const buttonClasses = cva("rounded-full font-semibold transition", {
  variants: {
    variant: {
      primary: "bg-blue-500 text-white hover:bg-blue-600 px-6 py-3",
      secondary: "bg-gray-500 text-white hover:bg-gray-600 px-6 py-3",
      danger: "bg-red-600 text-white hover:bg-red-700 px-6 py-3",
      outline:
        "border border-gray-500 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 active:bg-gray-600 px-6 py-3",
      white:
        "bg-white text-black font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 active:bg-gray-300 px-6 py-3",
      success: "bg-green-500 text-white hover:bg-green-600 px-6 py-3",
      transparent: "bg-transparent text-white hover:bg-gray-700 px-6 py-3",
      icon: "bg-transparent text-2xl hover:bg-gray-800 p-2 rounded-full",
      floating:
        "w-15 h-15 bg-[#1DA1F2] text-white flex items-center justify-center px-4 py-2 rounded hover:bg-[#1A91DA] transition fixed bottom-1/12 left-1/2 right-1/2",
    },
    size: {
      default: "",
      small: "px-4 py-2",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
});

type ButtonProps = {
  page?: string;
  text?: string;
  buttonType?: "button" | "submit" | "reset";
  object?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
} & VariantProps<typeof buttonClasses>;

function Button({
  page = "",
  text = "",
  buttonType = "button",
  object,
  onClick,
  variant,
  size,
}: ButtonProps) {
  const classes = buttonClasses({ variant, size });
  const content = (
    <>
      {text}
      {object && <span>{object}</span>}
    </>
  );

  if (!page) {
    return (
      <button type={buttonType} className={classes} onClick={onClick}>
        {content}
      </button>
    );
  }
  return (
    <Link to={page}>
      <button type={buttonType} className={classes} onClick={onClick}>
        {content}
      </button>
    </Link>
  );
}

export default Button;
