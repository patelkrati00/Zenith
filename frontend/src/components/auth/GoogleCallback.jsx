import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";

const API_BASE_URL = "http://localhost:3001";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // 1️⃣ Read the token from the URL (Google redirected here)
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      console.error("No token found in URL");
      navigate("/login");
      return;
    }

    // 2️⃣ Save token to localStorage
    localStorage.setItem("authToken", token);

    // 3️⃣ Fetch user details using the token
    const getUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.user) {
          // Save user to localStorage + context
          localStorage.setItem("authUser", JSON.stringify(data.user));
          login(data.user);

          // 4️⃣ Redirect to editor page
          navigate("/editor");
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/login");
      }
    };

    getUser();
  }, []);

  return (
    <div className="min-h-screen flex justify-center items-center text-white text-xl">
      Logging you in with Google…
    </div>
  );
}
