export function LogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="pc-grad-arrow" x1="8" y1="30" x2="28" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00D2FF" />
          <stop offset="1" stopColor="#3A7BD5" />
        </linearGradient>
        <linearGradient id="pc-grad-spark" x1="20" y1="2" x2="28" y2="10" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00D2FF" />
          <stop offset="1" stopColor="#3A7BD5" />
        </linearGradient>
      </defs>
      {/* Back page */}
      <rect x="6" y="10" width="18" height="24" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
      {/* Front page */}
      <rect x="12" y="6" width="18" height="24" rx="3" fill="#ffffff" stroke="#475569" strokeWidth="1.5" />
      <line x1="16" y1="12" x2="26" y2="12" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="16" x2="26" y2="16" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="20" x2="22" y2="20" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
      {/* Diagonal growth arrow */}
      <path d="M10 30 L24 14" stroke="url(#pc-grad-arrow)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M19 13 L25 13 L25 19" stroke="url(#pc-grad-arrow)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* AI spark on top */}
      <path
        d="M24 2 L25.2 5.5 L28.8 6.6 L25.2 7.7 L24 11.2 L22.8 7.7 L19.2 6.6 L22.8 5.5 Z"
        fill="url(#pc-grad-spark)"
      />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoIcon className="h-8 w-8 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight text-foreground">
          PageClone{" "}
          <span
            className="font-extrabold"
            style={{
              background: "linear-gradient(90deg, #00D2FF, #3A7BD5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AI
          </span>
        </span>
        <span className="mt-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
          Clonagem &amp; IA de Alta Conversão
        </span>
      </span>
    </span>
  );
}
