import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const status = params.get("status");
    const token = params.get("token");
    const tempToken = params.get("tempToken");

    // ✅ EXISTING USER
    if (status === "existing" && token) {
      localStorage.setItem("token", token);
      navigate("/home", { replace: true });
      return;
    }

    // ✅ NEW USER → redirect to login WITH tempToken
    if (status === "new" && tempToken) {
    navigate("/complete-profile", { state: { tempToken } });
      return;
    }

    // ❌ Anything else → login
    navigate("/", { replace: true });

  }, [location, navigate]);

  return <div>Finalizing authentication…</div>;
}

export default AuthCallback;
