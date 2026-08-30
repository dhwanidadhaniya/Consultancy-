import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import { Header } from "./components/Header";
import { CyberGridBackground } from "./components/ui/CyberGridBackground";
import Dashboard from "./pages/Dashboard";
import NetworkData from "./pages/NetworkData";
import Optimization from "./pages/Optimization";
import ScenarioLab from "./pages/ScenarioLab";
import RiskResilience from "./pages/RiskResilience";
import Insights from "./pages/Insights";

export default function App() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen bg-[#070A12] text-cyber-text flex flex-col font-body selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Background Cyber Mesh */}
      <CyberGridBackground />

      {/* Main Container */}
      <div className="relative z-10 flex min-h-screen w-full">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <Header />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <Routes location={location}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/network-data" element={<NetworkData />} />
                  <Route path="/optimization" element={<Optimization />} />
                  <Route path="/scenario-lab" element={<ScenarioLab />} />
                  <Route path="/risk-resilience" element={<RiskResilience />} />
                  <Route path="/insights" element={<Insights />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
