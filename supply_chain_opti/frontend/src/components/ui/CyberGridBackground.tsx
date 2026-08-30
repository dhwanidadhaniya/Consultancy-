export function CyberGridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070A12]">
      {/* Ambient Neon Light Orbs */}
      <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[140px] animate-pulse-glow" />
      <div className="absolute top-[40%] -right-[15%] w-[45vw] h-[45vw] rounded-full bg-purple-600/10 blur-[160px] animate-pulse-glow [animation-delay:2s]" />
      <div className="absolute -bottom-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/08 blur-[130px] animate-pulse-glow [animation-delay:4s]" />

      {/* Cyber Grid SVG */}
      <div
        className="absolute inset-0 opacity-[0.12] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}
