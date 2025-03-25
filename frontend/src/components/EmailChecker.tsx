// src/components/TweetList.tsx
import React, { useState, useEffect } from "react";
import Tweet from "../ui/tweet";


const isEmailValid = (email: string): boolean => {
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
  };
function TweetList() {
}

export default TweetList;
