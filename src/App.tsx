import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import MultiChain from "./pages/MultiChain";
import Transfer from "./pages/Transfer";
import Solana from "./pages/Solana";
import NotFound from "./pages/NotFound";
import { SolanaProvider } from "./components/SolanaProvider";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/multichain" element={<MultiChain />} />
        <Route path="/solana" element={<SolanaProvider><Solana /></SolanaProvider>} />
        <Route path="/transfer" element={<Transfer />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;