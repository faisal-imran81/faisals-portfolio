import { site } from "@/content/site";

/** Inline "Build → Break → Learn → Ship" signature. */
export function Motif({ className = "", highlight = 3 }: { className?: string; highlight?: number }) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.6875rem] uppercase tracking-[0.16em] ${className}`}>
      {site.tagline.map((t, i) => (
        <span key={t} className="inline-flex items-center gap-2">
          <span className={i === highlight ? "text-acid" : "text-paper-dim"}>{t}</span>
          {i < site.tagline.length - 1 ? <span className="text-mute-2" aria-hidden>→</span> : null}
        </span>
      ))}
    </span>
  );
}
