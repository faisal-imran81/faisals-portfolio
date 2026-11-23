import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0a0a09", position: "relative" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path d="M15 15h22v6H21v7h13v6H21v15h-6z" fill="#efece4" />
          <path d="M41 23h6v26h-6z" fill="#efece4" />
          <circle cx="44" cy="17" r="3.4" fill="#c8f135" />
        </svg>
      </div>
    ),
    size,
  );
}
