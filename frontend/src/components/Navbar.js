// src/components/Navbar.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Navbar.css";

// const API_BASE = "http://localhost:3000";
const API_BASE = 'https://synhack-dep.onrender.com';

function Navbar({ onRandomQuestion, onPostQuestion, onOpenProfile }) {
  const navigate = useNavigate();
  const [userInitials, setUserInitials] = useState("U");

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get(`${API_BASE}/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = response.data.user;
        if (user?.name) {
          const initials = user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          setUserInitials(initials || "U");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        setUserInitials("U");
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>ArchiteX</h1>
        <span className="navbar-subtitle">The CodeForces for System Design</span>
      </div>

      <div className="navbar-actions">
        <button className="btn-nav btn-random" onClick={onRandomQuestion}>
          <span className="icon">🎲</span>
          Random Question
        </button>
        <button className="btn-nav btn-post" onClick={onPostQuestion}>
          <span className="icon">➕</span>
          Post Question
        </button>
        <button 
          className="navbar-avatar" 
          onClick={onOpenProfile}
          title="View Profile"
        >
          {userInitials}
        </button>
        <button className="btn-nav btn-logout" onClick={handleLogout}>
          {/* <span className="icon">🚪</span> */}
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;