// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Post from "../pages/Post";
import Landing from "../pages/LoginORregister";
import Register from "../pages/Register";

function AppRouter() {
  return (
    <div className="bg-[#17202A] min-h-screen relative">
      {/* Header avec logo Twitter au centre (ex. SVG ou icône) */}
      <header className="flex justify-center items-center py-4">
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
      </header>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post" element={<Post />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<h2 className=" text-white">Page non trouvée</h2>} />
      </Routes>
    </BrowserRouter>
    
    </div>
  );
  
};

export default AppRouter;
