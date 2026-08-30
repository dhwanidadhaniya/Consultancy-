import { useEffect, useState } from "react";
import { Lightbulb, RefreshCw, Sparkles, TrendingUp, AlertCircle, ArrowUpRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import type { Insight } from "../types";
import { GlowCard } from "../components/ui/GlowCard";
import { ShimmerButton } from "../components/ui/ShimmerButton";
import { Badge } from "../components/ui/Badge";

export default function Insights() {
  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getInsights();
      setInsights(res.insights);
    } catch (e: any) {
      setError(e.message ?? "Run an optimization first.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={20} className="text-cyan-400 animate-pulse-glow" />
            <h1 className="font-display font-extrabold text-2xl text-white">AI Decision &amp; Network Insights</h1>
          </div>
          <p className="text-xs text-cyber-muted">
            Automated executive action items synthesized directly from linear programming dual values, shadow prices, and capacity constraints.
          </p>
        </div>

        <ShimmerButton
          variant="outline"
          size="md"
          loading={loading}
          icon={<RefreshCw size={14} />}
          onClick={load}
        >
          Refresh Insights
        </ShimmerButton>
      </header>

      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="font-mono text-xs text-cyber-muted">Synthesizing Decision Intelligence...</p>
        </div>
      )}

      {error && !loading && (
        <GlowCard glowColor="amber" className="p-8 text-center max-w-lg mx-auto">
          <div className="space-y-3">
            <AlertCircle size={32} className="text-amber-400 mx-auto" />
            <h3 className="font-display font-bold text-base text-white">Solver Results Required</h3>
            <p className="text-xs text-cyber-muted leading-relaxed">{error}</p>
            <Link to="/optimization">
              <ShimmerButton variant="cyan" size="md" icon={<Sparkles size={16} />}>
                Go to Optimizer Engine
              </ShimmerButton>
            </Link>
          </div>
        </GlowCard>
      )}

      {insights && !loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="section-label text-cyan-400">
              {insights.length} Executive Recommendations Identified
            </span>
            <Badge variant="cyan">Prescriptive AI Desk</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.map((ins, idx) => {
              const isHighPriority = ins.type.toLowerCase().includes("cost") || ins.type.toLowerCase().includes("capacity");
              const isAlert = ins.type.toLowerCase().includes("unmet") || ins.type.toLowerCase().includes("risk");

              return (
                <GlowCard
                  key={ins.type}
                  glowColor={isAlert ? "rose" : isHighPriority ? "cyan" : "purple"}
                  showBeam={idx === 0}
                  className="p-6 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={isAlert ? "rose" : isHighPriority ? "cyan" : "purple"}>
                        {ins.type.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                      <span className="text-[10px] font-mono text-cyber-faint">PRIORITY 0{idx + 1}</span>
                    </div>

                    <h3 className="font-display font-bold text-base text-white leading-snug">
                      {ins.title}
                    </h3>
                    <p className="text-xs text-cyber-muted leading-relaxed">{ins.detail}</p>
                  </div>

                  <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between text-xs">
                    <span className="text-cyber-faint font-mono flex items-center gap-1">
                      <CheckCircle size={12} className="text-emerald-400" /> Actionable Insight
                    </span>
                    <Link
                      to="/optimization"
                      className="text-cyan-400 hover:text-cyan-300 font-mono font-semibold flex items-center gap-1 transition-colors"
                    >
                      Review Impact <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </GlowCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
