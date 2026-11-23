/** Static blueprint rendering of the FI mark — used before WebGL is ready and when it's unavailable. */
export function MonogramFallback({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-60 -60 120 120" className={className} role="img" aria-label="FI monogram">
      <g fill="none" stroke="rgb(239 236 228 / 0.12)" strokeWidth="0.25">
        <circle r="50" />
        <ellipse rx="34" ry="11" transform="rotate(-18)" />
        <ellipse rx="42" ry="15" transform="rotate(24)" />
        <path d="M-58 0h14M44 0h14M0 -58v14M0 44v14" />
      </g>
      {Array.from({ length: 60 }).map((_, k) => {
        const a = (k / 60) * Math.PI * 2;
        const l = k % 5 === 0 ? 3 : 1.2;
        return (
          <line
            key={k}
            x1={Math.cos(a) * 50}
            y1={Math.sin(a) * 50}
            x2={Math.cos(a) * (50 - l)}
            y2={Math.sin(a) * (50 - l)}
            stroke="rgb(239 236 228 / 0.18)"
            strokeWidth="0.25"
          />
        );
      })}
      <g transform="translate(-16.85 -17) scale(10)">
        <path d="M0 3.4V0h2.25v.6H.62v.75h1.13v.6H.62V3.4z" fill="#161615" stroke="#c8f135" strokeOpacity=".55" strokeWidth=".02" />
        <path d="M2.75 .9h.62v2.5h-.62z" fill="#161615" stroke="#c8f135" strokeOpacity=".55" strokeWidth=".02" />
        <circle cx="3.06" cy=".34" r=".3" fill="#c8f135" />
      </g>
    </svg>
  );
}
