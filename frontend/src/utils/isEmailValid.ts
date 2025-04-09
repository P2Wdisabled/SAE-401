// src/utils/isEmailValid.ts
export function isEmailValid(email: string): boolean {
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
  }
  