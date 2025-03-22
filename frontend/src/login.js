import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "./supabaseClient"; 
import "./login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Login Response:", data, error);

      if (error) {
        console.error("Login Error:", error.message);
        alert("Error logging in: " + error.message);
        setLoading(false);
        return;
      }

      if (!data.user.confirmed_at) {
        alert("Please confirm your email before logging in.");
        setLoading(false);
        return;
      }

      // Extract the UUID from the user data
      const userUuid = data.user.id;
      console.log("User UUID:", userUuid);

      // Send the UUID to your FastAPI backend
      try {
        const backendResponse = await fetch('http://localhost:8000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`
          },
          body: JSON.stringify({
            uuid: userUuid,
            email: data.user.email
          })
        });

        if (!backendResponse.ok) {
          const errorData = await backendResponse.json();
          console.error("Backend Error:", errorData);
        } else {
          const backendData = await backendResponse.json();
          console.log("Backend Response:", backendData);
          
          // Store UUID for use throughout the app
          localStorage.setItem('userUuid', userUuid);
        }
      } catch (backendErr) {
        console.error("Error connecting to backend:", backendErr);
      }
      
      console.log("Logged in successfully:", data);
      navigate("/");
    } catch (err) {
      console.error("Unexpected Error:", err); 

      if (err instanceof Error) {
        alert(`An unexpected error occurred: ${err.message}\nStack Trace: ${err.stack || "No stack trace available."}`);
      } else {
        alert("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Log In</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())} // Remove spaces
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        <p>or</p>
        <button className="auth-btn" onClick={() => navigate("/signup")}>
          Sign Up
        </button>
        <p>
          Don't have an account?{" "}
          <span className="auth-link" onClick={() => navigate("/signup")}>
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;