import React from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App.tsx";
import { wagmiAdapter, appKit } from "./lib/reown-config";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

const queryClient = new QueryClient();

const container = document.getElementById("root");
if (!container) throw new Error('Failed to find root element');

createRoot(container).render(
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <App />
      <Analytics />
      <SpeedInsights />
    </WagmiProvider>
  </QueryClientProvider>
);
