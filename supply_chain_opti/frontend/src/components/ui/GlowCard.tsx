import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { BorderBeam } from "./BorderBeam";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: "cyan" | "emerald" | "purple" | "rose" | "amber";
  showBeam?: boolean;
  beamDuration?: number;
  interactive?: boolean;
}

const glowColorMap = {
  cyan: "rgba(0, 242, 254, 0.18)",
  emerald: "rgba(16, 185, 129, 0.18)",
  purple: "rgba(139, 92, 246, 0.18)",
  rose: "rgba(244, 63, 94, 0.18)",
  amber: "rgba(245, 158, 11, 0.18)",
};

const beamColorMap = {
  cyan: { from: "#00F2FE", to: "#38BDF8" },
  emerald: { from: "#10B981", to: "#34D399" },
  purple: { from: "#8B5CF6", to: "#C084FC" },
  rose: { from: "#F43F5E", to: "#FB7185" },
  amber: { from: "#F59E0B", to: "#FBBF24" },
};

export function GlowCard({
  children,
  className,
  glowColor = "cyan",
  showBeam = false,
  beamDuration = 8,
  interactive = true,
  ...props
}: GlowCardProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={interactive ? { y: -3, transition: { duration: 0.2 } } : undefined}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "glass-card relative overflow-hidden transition-all duration-300",
        isHovered && "border-white/20 shadow-2xl",
        className
      )}
      {...(props as any)}
    >
      {/* Spotlight Effect */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${
              mousePos.y
            }px, ${glowColorMap[glowColor]}, transparent 40%)`,
          }}
        />
      )}

      {/* Border Beam */}
      {showBeam && (
        <BorderBeam
          size={250}
          duration={beamDuration}
          colorFrom={beamColorMap[glowColor].from}
          colorTo={beamColorMap[glowColor].to}
        />
      )}

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
