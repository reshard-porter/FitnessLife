import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "@capacitor/core"; // exposes window.Capacitor helpers inside the native shell

createRoot(document.getElementById("root")).render(<App />);
