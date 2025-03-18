// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  preview: {
   port: 5173,
   strictPort: true,
  },
  server: {
   port: 5173,
   strictPort: true,
   host: true,
   origin: "http://localhost:8090",
   allowedHosts: ["sae-frontend"]
  },
});