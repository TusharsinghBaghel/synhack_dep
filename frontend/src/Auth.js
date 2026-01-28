import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import "./Auth.css";

const API_BASE = 'https://synhack-dep.onrender.com';      // BACKEND
const FRONTEND_BASE = "https://www.systemarchi.tech/"; // FRONTEND

function Auth() {
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  // New user flow
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [name, setName] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- Handle Redirect From Backend ---------------- */
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const status = params.get("status");
    const token = params.get("token");
    const tmpToken = params.get("tempToken");

    // Existing user
    if (status === "existing" && token) {
      localStorage.setItem("token", token);
      navigate("/home");
    }

    // New user → ask for name
    if (status === "new" && tmpToken) {
      setTempToken(tmpToken);
      setShowNamePrompt(true);
    }
  }, [location, navigate]);

  /* ---------------- Start Google OAuth ---------------- */
  const handleGoogleSignIn = () => {
    setError("");
    setIsSigningIn(true);

    window.location.href = `${API_BASE}/auth/google`;
  };

  /* ---------------- Complete Google Signup ---------------- */
  const submitName = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await axios.post(
        `${API_BASE}/auth/google/complete-profile`,
        { name: name.trim() },
        {
          headers: {
            Authorization: `Bearer ${tempToken}`,
          },
        }
      );

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        navigate("/home");
      } else {
        setError("Failed to complete signup");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="auth-container">

      {/* Loader */}
      {isSigningIn && (
        <div className="loader-overlay">
          <div className="sd-modal">
            <div className="loader-title">Redirecting to Google…</div>
          </div>
        </div>
      )}

      {/* Name Prompt */}
      {showNamePrompt && (
        <div className="loader-overlay" role="dialog">
          <div className="sd-modal" style={{ maxWidth: 420 }}>
            <h3 style={{ color: "#fff" }}>Almost there</h3>
            <p style={{ color: "#cfe9ff" }}>
              Please enter your name to complete signup
            </p>

            {error && <div className="auth-error">{error}</div>}

            <input
              type="text"
              className="auth-input"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <button
              className="btn btn-primary"
              onClick={submitName}
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Continue"}
            </button>
          </div>
        </div>
      )}

      {/* Main Auth Box */}
      <div className="auth-box">
        <h2>Welcome Back</h2>

        {error && <div className="auth-error">{error}</div>}

        <button
          className="btn-google"
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
        >
          <FcGoogle className="google-icon" />
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}

export default Auth;
