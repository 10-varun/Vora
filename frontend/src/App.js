import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import MainPage from "./MainPage";  // ✅ Ensure the file name matches exactly
import ChatbotInt from "./ChatbotInt"; // ✅ Import Chatbot Page

function App() {
  return (
    <Router>
      <AppRoutes />
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
      <Route path="/chatbot" element={<ChatbotInt navigateBack={navigateBack} />} />
    </Routes>
  );
}

export default App;
