import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

const API_BASE = "http://localhost:3000";

function CompleteProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.tempToken) {
      setTempToken(location.state.tempToken);
    } else {
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  const submitName = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);
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
        navigate("/home", { replace: true });
      } else {
        setError("Failed to complete profile");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Profile completion failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box light-card">
        <h2 className="profile-title">Complete Your Profile</h2>

        {error && <div className="auth-error">{error}</div>}

        {/* Label */}
        <label className="input-label">Add Name</label>

        {/* Stylish input */}
        <input
          type="text"
          className="pill-input"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          className="btn btn-primary full-width"
          onClick={submitName}
          disabled={loading}
        >
          {loading ? "Saving…" : "CONTINUE"}
        </button>
      </div>
    </div>
  );
}

export default CompleteProfile;
