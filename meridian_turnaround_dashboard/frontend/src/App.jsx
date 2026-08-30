import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import Financials from "./pages/Financials";
import Operations from "./pages/Operations";
import Strategy from "./pages/Strategy";
import TurnaroundPlan from "./pages/TurnaroundPlan";
import Scenarios from "./pages/Scenarios";
import Implementation from "./pages/Implementation";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/financials" element={<Financials />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/strategy" element={<Strategy />} />
            <Route path="/plan" element={<TurnaroundPlan />} />
            <Route path="/scenarios" element={<Scenarios />} />
            <Route path="/implementation" element={<Implementation />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
