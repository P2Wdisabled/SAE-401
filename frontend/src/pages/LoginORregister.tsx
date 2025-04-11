import React from "react";
import { Link } from "react-router-dom";
import Button from "../ui/Button";
import {useCheckToken} from "../components/Checker"; // Adapted according to your structure

function Landing() {
  useCheckToken();

  return (
    <div className="min-h-screen bg-[#17202A] text-white flex flex-col items-center justify-center p-4">
      {/* Main Title */}
      <h1 className="text-2xl font-bold mb-6 text-center max-w-md">
        Discover what's happening in the world in real time.
      </h1>

      {/* "Create an account" Button */}
      
        <Button page="/register" text="Create an account" />

      {/* Legal Notice */}
      <div className="mt-6 text-gray-400 text-sm text-center max-w-sm leading-relaxed">
        <p>
          By signing up, you agree to our{" "}
          <Link to="/terms" className="text-[#1DA1F2] hover:underline">
            Terms of Service
          </Link>
          , our{" "}
          <Link to="/privacy" className="text-[#1DA1F2] hover:underline">
            Privacy Policy
          </Link>{" "}
          and our{" "}
          <Link to="/cookies" className="text-[#1DA1F2] hover:underline">
            Cookie Policy
          </Link>
          .
        </p>
      </div>

      {/* Login Link */}
      <div className="mt-4 text-gray-400 text-sm">
        <p>
          Already have an account?{" "}
          <Link to="/login" className="text-[#1DA1F2] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Landing;
