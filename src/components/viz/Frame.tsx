import type { ReactNode } from "react";

/** Blueprint frame used by every project visualization. */
export function VizFrame({ label, children, accent, className = "" }: { label: string; children: ReactNode; accent: string; className?: string }) {
  return (
    <div className={`crop-marks relative overflow-hidden border hairline bg-ink-2 ${className}`}>
      <div className="pointer-events-none absolute inset-0 blueprint-grid-fine" />
      <div className="relative flex items-center justify-between border-b hairline px-4 py-2.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-mute">
        <span>{label}</span>
        <span className="size-1.5 rounded-full" style={{ background: accent }} aria-hidden />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
