// src/components/TweetList.tsx
import React from "react";


const isEmailValid = (email: string): boolean => {
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
  };

export default isEmailValid;
