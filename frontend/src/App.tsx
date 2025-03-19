// src/App.tsx
import React from "react";
import AppRouter from "./router/AppRouter";
const response = await fetch('http://localhost:8080/posts?page=1');
console.log(await response.json())
function App() {
  return <AppRouter />;
}

export default App;
