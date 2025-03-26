import React from "react"
import Button from "../ui/Button";
import {useLogout } from "../components/logger"
import { Link } from "react-router-dom";

function Header() {
  const logout = useLogout();
  if (localStorage.getItem("token")) {
    return (
        <header className=" relative">

          <div className="flex justify-center items-center py-4 w-full">
          <Link to="/">
          <svg
          fill="white"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="w-6 h-6"
        >
          <g>
            <path d="M23.44 4.83c-.81.36-1.69.61-2.61.72a4.55 4.55 0 0 0 2-2.51 9.24 9.24 0 0 1-2.88 1.1 4.51 4.51 0 0 0-7.69 4.12A12.8 12.8 0 0 1 1.64 3.16a4.51 4.51 0 0 0 1.4 6 4.48 4.48 0 0 1-2-.56v.06a4.51 4.51 0 0 0 3.62 4.42 4.52 4.52 0 0 1-2 .07 4.51 4.51 0 0 0 4.21 3.13A9.05 9.05 0 0 1 1 19.54a12.77 12.77 0 0 0 6.92 2 12.75 12.75 0 0 0 12.8-12.8c0-.2 0-.39-.01-.58a9.15 9.15 0 0 0 2.73-2.65z"></path>
          </g>
        </svg>
        </Link>
          </div>
      <Button
        onClick={logout}
        text="Déconnexion"
        moreClasses="absolute top-1/11 text-white right-1/12"
      />
          </header>
    );
    
  }else{
    return (
        <header className=" relative">
          <div className="flex justify-center items-center py-4 w-full">
          <Link to="/">
          <svg
          fill="white"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="w-6 h-6"
        >
          <g>
            <path d="M23.44 4.83c-.81.36-1.69.61-2.61.72a4.55 4.55 0 0 0 2-2.51 9.24 9.24 0 0 1-2.88 1.1 4.51 4.51 0 0 0-7.69 4.12A12.8 12.8 0 0 1 1.64 3.16a4.51 4.51 0 0 0 1.4 6 4.48 4.48 0 0 1-2-.56v.06a4.51 4.51 0 0 0 3.62 4.42 4.52 4.52 0 0 1-2 .07 4.51 4.51 0 0 0 4.21 3.13A9.05 9.05 0 0 1 1 19.54a12.77 12.77 0 0 0 6.92 2 12.75 12.75 0 0 0 12.8-12.8c0-.2 0-.39-.01-.58a9.15 9.15 0 0 0 2.73-2.65z"></path>
          </g>
        </svg>
        </ Link>
          </div>
          </header>
    );
  }
}

  export default Header;
