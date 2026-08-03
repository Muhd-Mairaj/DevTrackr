import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// Configure the generated axios client (baseURL, credentials, 401 interceptor)
import "./lib/api";
import App from "./App.tsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
