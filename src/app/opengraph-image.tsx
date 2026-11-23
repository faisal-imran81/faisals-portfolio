import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = `${site.name}, ${site.role}. ${site.headline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const lime = "#c8f135";
  const paper = "#efece4";
  const mute = "#8b8880";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#0a0a09",
          backgroundImage:
            "linear-gradient(to right, rgba(239,236,228,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(239,236,228,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          color: paper,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: mute, letterSpacing: 3 }}>
          <div style={{ display: "flex" }}>PORTFOLIO 2026</div>
          <div style={{ display: "flex" }}>FAISALABAD, PK</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
          <svg width="230" height="230" viewBox="0 0 64 64">
            <rect x="1" y="1" width="62" height="62" fill="none" stroke={lime} strokeOpacity="0.4" strokeWidth="0.5" />
            <path d="M15 15h22v6H21v7h13v6H21v15h-6z" fill={paper} />
            <path d="M41 23h6v26h-6z" fill={paper} />
            <circle cx="44" cy="17" r="3.4" fill={lime} />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>{site.name}</div>
            <div style={{ fontSize: 40, color: paper, opacity: 0.85, marginTop: 14 }}>{site.headline}</div>
            <div style={{ fontSize: 24, color: mute, marginTop: 18 }}>{site.positioning}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 18, fontSize: 26, letterSpacing: 2 }}>
          {site.tagline.map((t, i) => (
            <div key={t} style={{ display: "flex", gap: 18, color: i === 3 ? lime : paper }}>
              {t.toUpperCase()}
              {i < 3 ? <span style={{ color: mute }}>→</span> : null}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
