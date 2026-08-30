import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

interface ShimmerButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  className?: string;
  variant?: "cyan" | "purple" | "emerald" | "amber" | "rose" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles = {
  cyan: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-cyan border border-cyan-400/50 hover:brightness-110",
  purple: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-purple border border-purple-400/50 hover:brightness-110",
  emerald: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-glow-emerald border border-emerald-400/50 hover:brightness-110",
  amber: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-card border border-amber-400/50 hover:brightness-110",
  rose: "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-glow-rose border border-rose-400/50 hover:brightness-110",
  outline: "bg-cyber-dark/80 text-cyber-text border border-white/15 hover:border-cyan-400/60 hover:text-cyan-400 hover:shadow-glow-cyan",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-sm font-semibold rounded-xl gap-2",
  lg: "px-6 py-3 text-base font-semibold rounded-xl gap-2.5",
};

export function ShimmerButton({
  children,
  className,
  variant = "cyan",
  size = "md",
  loading = false,
  icon,
  disabled,
  ...props
}: ShimmerButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden transition-all duration-200 cursor-pointer font-display disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {/* Shimmer sweep effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
