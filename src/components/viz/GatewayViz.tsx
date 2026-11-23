"use client";

import { motion, useReducedMotion } from "motion/react";

type Box = { label: string; sub: string; x: number; y: number; hi?: boolean };

const W = 128;
const H = 58;
const col = (i: number) => 12 + i * 126;

// Query path (top) and ingestion path (bottom), as described in the project SRS.
const query: Box[] = [
  { label: "Developer", sub: "asks a question", x: col(0), y: 34 },
  { label: "Access check", sub: "repo + module", x: col(1), y: 34, hi: true },
  { label: "Retrieval", sub: "authorized only", x: col(2), y: 34 },
  { label: "LLM", sub: "redacted context", x: col(3), y: 34 },
  { label: "Answer", sub: "+ audit log", x: col(4) - 6, y: 34 },
];
const ingest: Box[] = [
  { label: "GitHub repo", sub: "via GitHub App", x: col(0), y: 196 },
  { label: "Secret scan", sub: "detect keys", x: col(1), y: 196, hi: true },
  { label: "Redaction", sub: "before indexing", x: col(2), y: 196, hi: true },
  { label: "Index", sub: "semantic search", x: col(3), y: 196 },
];

/** SecureCode Navigator: access-checked RAG with secret redaction before indexing. */
export function GatewayViz({ accent }: { accent: string }) {
  const reduce = useReducedMotion();
  const all = [...query, ...ingest];

  return (
    <svg
      viewBox="0 0 640 290"
      className="h-auto w-full"
      role="img"
      aria-label="SecureCode Navigator architecture: a developer question passes an access check, then only authorized, redacted code is retrieved and sent to the LLM, and the answer is logged. Code from GitHub is scanned for secrets and redacted before it is indexed for semantic search."
    >
      <defs>
        <marker id="gw-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L8 4L0 8" fill="none" stroke="rgb(239 236 228 / .45)" />
        </marker>
      </defs>

      <text x="12" y="20" fill="rgb(139 136 128)" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="1.4">QUERY PATH</text>
      <text x="12" y="182" fill="rgb(139 136 128)" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="1.4">INGESTION PATH</text>

      {/* horizontal connectors */}
      {[0, 1, 2, 3].map((i) => (
        <path key={`q${i}`} d={`M ${query[i].x + W} ${34 + H / 2} H ${query[i + 1].x - 2}`} stroke="rgb(239 236 228 / .3)" markerEnd="url(#gw-arrow)" />
      ))}
      {[0, 1, 2].map((i) => (
        <path key={`g${i}`} d={`M ${ingest[i].x + W} ${196 + H / 2} H ${ingest[i + 1].x - 2}`} stroke="rgb(239 236 228 / .3)" markerEnd="url(#gw-arrow)" />
      ))}
      {/* index feeds retrieval */}
      <path
        d={`M ${ingest[3].x + W / 2} 196 V 150 H ${query[2].x + W / 2} V ${34 + H + 2}`}
        fill="none"
        stroke={accent}
        strokeOpacity=".6"
        className={reduce ? "" : "flow-dash"}
        markerEnd="url(#gw-arrow)"
      />
      <text x={query[2].x + W / 2 + 8} y="143" fill={accent} fontSize="9" fontFamily="var(--font-mono)" letterSpacing="1.2">
        ONLY CHUNKS THE USER MAY SEE
      </text>

      {all.map((b, i) => (
        <motion.g
          key={b.label}
          initial={{ opacity: 0, y: reduce ? 0 : 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 + i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <rect x={b.x} y={b.y} width={W - 14} height={H} fill="#0f0f0e" stroke={b.hi ? accent : "rgb(239 236 228 / .18)"} strokeOpacity={b.hi ? 0.75 : 1} />
          <text x={b.x + 10} y={b.y + 25} fill="#efece4" fontSize="13" fontWeight="600" letterSpacing="-0.2">{b.label}</text>
          <text x={b.x + 10} y={b.y + 43} fill="rgb(139 136 128)" fontSize="10">{b.sub}</text>
        </motion.g>
      ))}

      <text x="12" y="282" fill="rgb(139 136 128)" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="1.2">
        PLANNED ARCHITECTURE, FROM THE PROJECT SRS
      </text>
    </svg>
  );
}
