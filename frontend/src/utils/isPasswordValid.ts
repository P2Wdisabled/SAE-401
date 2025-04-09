// src/utils/isPasswordValid.ts
export function isPasswordValid(password: string): boolean {
    const minLength = 8;
    const hasDigit = /[0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[\W_]/.test(password);
    return password.length >= minLength && hasDigit && hasUpper && hasLower && hasSpecial;
  }
  