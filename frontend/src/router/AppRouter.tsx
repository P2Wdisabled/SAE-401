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
import Profile from "../pages/Profile";
import EditProfile from "../pages/EditProfile";
import BlockedUsers from "../pages/BlockedProfile";
import CensorDashboard from "../pages/CensorDashboard";
import Settings from "../pages/Settings";
import Hashtag from "../pages/Hashtag";

function AppRouter() {
  return (
    <BrowserRouter>
      <div className="bg-[#17202A] min-h-screen relative">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/hashtag/:tag" element={<Hashtag />} /> 
          <Route path="/post" element={<Post />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/profile/blocked" element={<BlockedUsers />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/censor" element={<CensorDashboard />} />
          <Route path="/admin/edit/:id" element={<EditAccount />} />
          <Route path="*" element={<h2 className="text-white">Page not found</h2>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default AppRouter;
