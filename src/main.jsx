/**
 * main.jsx
 * --------
 * Application entry point.
 * Mounts the React app into the #root DOM element defined in index.html.
 * StrictMode is enabled to surface potential issues during development
 * (double-invokes effects and renders in dev mode only).
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
