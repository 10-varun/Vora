import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./MainPage"; // Import MainPage component
import Login from "./login"; // Ensure this file exists
import SignUp from "./Signup"; // Ensure this file exists
import "./App.css"; // Import styles

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
