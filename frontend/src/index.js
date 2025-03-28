import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // Ensure this file exists
import App from "./App"; 

const root = document.getElementById("root");

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
