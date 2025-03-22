import React from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import "./MainPage.css"; // Ensure this file exists and is correctly linked

const MainPage = () => {
  return (
    <div className="Page">
      <div className="Container1">
        {/* Sidebar */}
        <div className="sidebar">
          <h1>Vora</h1>
        </div>

        {/* Main Content */}
        <div className="container">
          <div className="header">
            <div className="text">Welcome to Vora</div>
            <div className="underline1"></div>
          </div>

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
  );
};

export default MainPage;
