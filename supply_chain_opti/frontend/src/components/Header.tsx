import { useState, useEffect } from "react";
import { Badge } from "./ui/Badge";
import { ShimmerButton } from "./ui/ShimmerButton";
import { Cpu, RefreshCw, Zap, Bell, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Header() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 glass-panel backdrop-blur-xl px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
      {/* Left: System Status Pill & Title */}
      <div className="flex items-center gap-3">
        <Badge variant="cyan" pulse icon={<Cpu size={12} />}>
          LP SOLVER ONLINE
        </Badge>
        <div className="hidden sm:flex items-center gap-2 text-xs text-cyber-muted border-l border-white/10 pl-3">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Multi-Echelon MIP Engine v2.4</span>
        </div>
      </div>

      {/* Right: Clock, Status, Actions */}
      <div className="flex items-center gap-3.5">
        <div className="hidden md:flex flex-col items-end text-[11px] font-mono">
          <span className="text-cyber-text font-semibold">{time}</span>
          <span className="text-cyber-faint">SYSTEM UTC</span>
        </div>

        <button
          onClick={() => navigate("/optimization")}
          className="p-2 rounded-lg text-cyber-muted hover:text-cyan-400 hover:bg-white/5 transition-colors relative"
          title="System Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        </button>

        <ShimmerButton
          variant="cyan"
          size="sm"
          icon={<Zap size={14} />}
          onClick={() => navigate("/optimization")}
        >
          Run Optimization
        </ShimmerButton>
      </div>
    </header>
  );
}
