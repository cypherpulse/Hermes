import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("root");
if (!container) throw new Error('Failed to find root element');

createRoot(container).render(
  <>
    <App />
    <Analytics />
    <SpeedInsights />
  </>
);
