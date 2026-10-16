
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "#2d2e30",
          color: "#e8eaed",
          border: "1px solid #3c4043",
          fontSize: "14px",
        },
        success: { iconTheme: { primary: "#34a853", secondary: "#2d2e30" } },
        error: { iconTheme: { primary: "#ea4335", secondary: "#2d2e30" } },
      }}
    />
  </>,
);