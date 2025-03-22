import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import MainPage from "./MainPage"; // Ensure this file exists
import ChatbotInt from "./ChatbotInt"; // Ensure this file exists
import Login from "./login"; // Ensure this file exists
import SignUp from "./Signup"; // Ensure this file exists
import Dashboard from "./Dashboard"; // Ensure this file exists
import "./App.css"; // Import styles

function App() {
  return (
    <Router>
      <div className="App">
        <AppRoutes />
      </div>
    </Router>
  );
}

function AppRoutes() {
  const [navHistory, setNavHistory] = useState([{ id: "MainPage" }]); // Initialize with MainPage
  const [activeSection, setActiveSection] = useState("MainPage");
  const navigate = useNavigate(); // React Router navigation

  const navigateBack = () => {
    if (navHistory.length > 1) {
      const newHistory = [...navHistory];
      newHistory.pop();
      setNavHistory(newHistory);
      setActiveSection(newHistory[newHistory.length - 1]?.id || "MainPage");
      navigate(`/${newHistory[newHistory.length - 1]?.id.toLowerCase() || ""}`);
    } else {
      setNavHistory([{ id: "MainPage" }]);
      setActiveSection("MainPage");
      navigate("/"); // Redirect to MainPage
    }
  };

  return (
    <Routes>
      <Route path="/" element={<MainPage navigateBack={navigateBack} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/chatbot" element={<ChatbotInt navigateBack={navigateBack} />} />
    </Routes>
  );
}

export default App;
