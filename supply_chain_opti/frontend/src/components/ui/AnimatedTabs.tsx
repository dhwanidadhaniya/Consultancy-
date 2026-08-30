import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: any;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function AnimatedTabs({
  tabs,
  activeTab,
  onChange,
  className,
}: AnimatedTabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 p-1.5 glass-panel rounded-xl overflow-x-auto border border-white/10",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors duration-200 shrink-0",
              isActive ? "text-white" : "text-cyber-muted hover:text-cyber-text"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 rounded-lg shadow-glow-cyan"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            {Icon && (
              <Icon
                size={14}
                className={cn("relative z-10 transition-colors", isActive ? "text-cyan-400" : "text-cyber-faint")}
              />
            )}
            <span className="relative z-10 font-display">{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "relative z-10 font-mono text-[10px] px-1.5 py-0.2 rounded-full",
                  isActive ? "bg-cyan-500/30 text-cyan-300" : "bg-white/10 text-cyber-faint"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
