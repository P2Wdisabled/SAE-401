import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { getBlockedUsers } from "../api/getBlockedUsers";
import { unblockUser } from "../api/unblockUser";

interface BlockedProfile {
  username: string;
  profilePicture: string;
}

const BlockedUsers: React.FC = () => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Function to fetch the list of blocked users via the API
  const fetchBlockedUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    try {
      const users = await getBlockedUsers(token);
      setBlockedUsers(users);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  // Function to unblock a user via the API
  const handleUnblock = async (username: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/landing");
      return;
    }
    try {
      await unblockUser(token, username);
      setBlockedUsers((prevUsers) =>
        prevUsers.filter((user) => user.username !== username)
      );
    } catch (error) {
      console.error("Error while unblocking", error);
    }
  };

  if (loading) {
    return <div className="text-center mt-4 text-white">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <h1 className="text-2xl font-bold mt-4 mb-4 text-white">
        Blocked Users
      </h1>
      {blockedUsers.length === 0 ? (
        <p className="text-white">No blocked users.</p>
      ) : (
        <ul>
          {blockedUsers.map((user, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-2 border-b border-gray-300"
            >
              <div className="flex items-center gap-4">
                <img
                  src={user.profilePicture}
                  alt={user.username}
                  className="w-10 h-10 rounded-full"
                />
                <span className="text-white">{user.username}</span>
              </div>
              {/* Using the "success" variant in "small" size to unblock */}
              <Button
                text="Unblock"
                onClick={() => handleUnblock(user.username)}
                variant="success"
                size="small"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BlockedUsers;
