// src/utils/checkPasswordStrength.ts
export function checkPasswordStrength(password: string): string {
    let strengthScore = 0;
    if (password.length >= 8) strengthScore++;
    if (/[A-Z]/.test(password)) strengthScore++;
    if (/[a-z]/.test(password)) strengthScore++;
    if (/[0-9]/.test(password)) strengthScore++;
    if (/[\W_]/.test(password)) strengthScore++;
  
    if (strengthScore <= 2) return "Faible";
    if (strengthScore === 3 || strengthScore === 4) return "Moyen";
    if (strengthScore === 5) return "Fort";
    return "";
  }
  