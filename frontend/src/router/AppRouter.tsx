// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Post from "../pages/Post";
import Landing from "../pages/LoginORregister";
import Register from "../pages/Register";
import Login from "../pages/Login";
import Header from "../ui/Header";
import Dashboard from "../pages/AdminDashboard";
import EditAccount from "../pages/AdminEdit";

function AppRouter() {
  return (
    <BrowserRouter>
      <div className="bg-[#17202A] min-h-screen relative">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post" element={<Post />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/edit/:id" element={<EditAccount />} />
          <Route path="*" element={<h2 className="text-white">Page non trouvée</h2>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default AppRouter;
