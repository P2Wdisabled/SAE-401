import React from "react";
import { Link } from "react-router-dom";

type ButtonProps = {
  page: string;
  text: string;
};

function Button({ page, text }: ButtonProps) {
  return (
    <Link to={page}>
    <button className="bg-[#1DA1F2] px-6 py-3 rounded-full font-semibold hover:bg-[#1A91DA] transition">
      {text}
    </button>
  </Link>
  );
}

export default Button;