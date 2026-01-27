import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// ✅ Bootstrap CSS
import "bootstrap/dist/css/bootstrap.min.css";

// Optional: Bootstrap JS (for modal, dropdown, etc.)
import "bootstrap/dist/js/bootstrap.bundle.min.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
