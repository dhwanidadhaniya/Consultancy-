import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ReactNode } from "react";
import { GlowCard } from "./ui/GlowCard";
import { Badge } from "./ui/Badge";

interface Props {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "warn" | "good" | "cyan" | "purple";
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  showBeam?: boolean;
}

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "cyan",
  trend,
  showBeam = false,
}: Props) {
  const glowColorMap = {
    default: "cyan" as const,
    cyan: "cyan" as const,
    good: "emerald" as const,
    warn: "rose" as const,
    purple: "purple" as const,
  };

  const textToneMap = {
    default: "text-cyan-400 text-glow-cyan",
    cyan: "text-cyan-400 text-glow-cyan",
    good: "text-emerald-400 text-glow-emerald",
    warn: "text-rose-400 text-glow-rose",
    purple: "text-purple-400",
  };

  return (
    <GlowCard
      glowColor={glowColorMap[tone]}
      showBeam={showBeam}
      className="p-5 flex flex-col justify-between gap-3 min-w-0"
    >
      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="section-label">{label}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-cyber-muted">
            <Icon size={16} strokeWidth={1.75} />
          </div>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline justify-between gap-2">
        <p className={`font-display font-bold text-2xl lg:text-3xl leading-none ${textToneMap[tone]}`}>
          {value}
        </p>

        {trend && (
          <Badge
            variant={trend.isPositive ? "emerald" : "rose"}
            pulse={false}
            icon={
              trend.isPositive ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )
            }
          >
            {trend.value}
          </Badge>
        )}
      </div>

      {/* Subtext description */}
      {sub && <p className="text-xs text-cyber-muted font-normal leading-relaxed">{sub}</p>}
    </GlowCard>
  );
}
