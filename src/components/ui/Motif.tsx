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

/** Full-bleed marquee band — section divider. CSS-only, pauses on hover. */
export function MotifMarquee() {
  const row = (
    <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden>
      {Array.from({ length: 3 }).flatMap((_, k) =>
        site.tagline.map((t, i) => (
          <span key={`${k}-${t}`} className="flex items-center gap-10">
            <span className={`display-md ${i === 3 ? "text-acid" : i === 1 ? "font-serif italic font-normal text-paper-dim" : "text-paper"}`}>
              {t}
            </span>
            <svg width="36" height="14" viewBox="0 0 36 14" className="text-mute-2" aria-hidden>
              <path d="M0 7h34M28 1l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
        )),
      )}
    </div>
  );
  return (
    <div className="group relative overflow-hidden border-y hairline py-6 md:py-8" role="presentation">
      <span className="sr-only">Build, Break, Learn, Ship.</span>
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {row}
        {row}
      </div>
    </div>
  );
}
