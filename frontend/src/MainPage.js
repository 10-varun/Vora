import React from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import "./MainPage.css"; // Ensure this file exists and is correctly linked
import { Link } from "react-router-dom"; // Import Link for navigation
import "./MainPage.css"; // Ensure this file exists and is correctly linked

const MainPage = () => {
  const navigate = useNavigate(); // ✅ Initialize useNavigate here

  return (
    <div className="Page">
      <div className="Container1">
        {/* Sidebar */}
        <div className="sidebar">
          <h1>Vora</h1>
          <nav>
            <ul>
              <li className="menu-item">Home</li>
              <li className="menu-item">User Profile</li>
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="container">
          <div className="header">
            <div className="text">Welcome to Vora</div>
            <div className="underline1"></div>
          </div>

          {/* Main Options */}
          <div className="menu">
            <button className="menu-item" onClick={() => navigate("/chatbot")}>
              Start Interview
            </button>
            <button className="menu-item">Improve Speaking Skills</button>
            <button className="menu-item">Personalized Learning Path</button>
            <button className="menu-item">Analytics & Feedback</button>
            <button className="menu-item">Customize Voice</button>
            <button className="menu-item">Settings</button>
          {/* Login and Sign Up Buttons */}
          <div className="menu">
            <Link to="/login">
              <button className="menu-item">Login</button>
            </Link>
            <Link to="/signup">
              <button className="menu-item">Sign Up</button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2024 Vora | AI Interview Assistant</p>
      </footer>
    </div>
    </div>
  );
};

export default MainPage;
