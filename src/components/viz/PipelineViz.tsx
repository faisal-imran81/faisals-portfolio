"use client";

import { motion, useReducedMotion } from "motion/react";

const stages = [
  { id: "repo", label: "GitHub repo", sub: "paste URL" },
  { id: "ai", label: "Groq LLM", sub: "analyse stack" },
  { id: "gen", label: "Dockerfile", sub: "+ Actions CI" },
  { id: "build", label: "Docker", sub: "build · tag" },
  { id: "ecr", label: "AWS ECR", sub: "push image" },
  { id: "ec2", label: "AWS EC2", sub: "run · Nginx" },
];

/** LaunchFlow: repo → AI → container → cloud, with logs streaming back over SSE. */
export function PipelineViz({ accent }: { accent: string }) {
  const reduce = useReducedMotion();
  const W = 640;
  const col = (i: number) => 24 + (i % 3) * 206;
  const row = (i: number) => (i < 3 ? 40 : 178);
  // serpentine path through the six stages
  const path = `M ${col(0) + 160} ${row(0) + 36} H ${col(1)} M ${col(1) + 160} ${row(1) + 36} H ${col(2)} M ${col(2) + 80} ${row(2) + 72} V ${row(5)} M ${col(5)} ${row(5) + 36} H ${col(4) + 160} M ${col(4)} ${row(4) + 36} H ${col(3) + 160}`;

  return (
    <svg viewBox={`0 0 ${W} 300`} className="h-auto w-full" role="img" aria-label="LaunchFlow deployment pipeline: GitHub repo, Groq analysis, Dockerfile and CI generation, Docker build, push to AWS ECR, deploy to AWS EC2 with Nginx; logs stream back via SSE.">
      <defs>
        <marker id="pf-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L8 4L0 8" fill="none" stroke="rgb(239 236 228 / .4)" />
        </marker>
      </defs>
      <path d={path} fill="none" stroke="rgb(239 236 228 / .28)" strokeWidth="1" markerEnd="url(#pf-arrow)" />
      {/* SSE log return line */}
      <path d={`M ${col(0)} ${row(5) + 36} H 8 V ${row(0) + 36} H ${col(0) - 2}`} fill="none" stroke={accent} strokeOpacity=".55" strokeWidth="1" className={reduce ? "" : "flow-dash"} />
      <text x={col(0)} y="282" fill={accent} fontSize="9" fontFamily="var(--font-mono)" letterSpacing="1.4">LIVE LOGS BACK TO THE BROWSER (SSE)</text>

      {stages.map((s, i) => {
        const x = i < 3 ? col(i) : col(5 - i + 3);
        const y = row(i);
        const hi = i === 1 || i === 5;
        return (
          <motion.g
            key={s.id}
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.09, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <rect x={x} y={y} width="160" height="72" fill="#0f0f0e" stroke={hi ? accent : "rgb(239 236 228 / .18)"} strokeOpacity={hi ? 0.7 : 1} />
            <text x={x + 12} y={y + 20} fill="rgb(139 136 128)" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="1.2">{`0${i + 1}`}</text>
            <text x={x + 12} y={y + 44} fill="#efece4" fontSize="15" fontWeight="600" letterSpacing="-0.3">{s.label}</text>
            <text x={x + 12} y={y + 61} fill="rgb(139 136 128)" fontSize="10.5">{s.sub}</text>
          </motion.g>
        );
      })}

      {!reduce && (
        <motion.circle
          r="3.5"
          fill={accent}
          animate={{
            cx: [col(0) + 160, col(1), col(1) + 160, col(2), col(2) + 80, col(2) + 80, col(4) + 160, col(3) + 160],
            cy: [row(0) + 36, row(0) + 36, row(0) + 36, row(0) + 36, row(2) + 72, row(5), row(5) + 36, row(5) + 36],
            opacity: [0, 1, 1, 1, 1, 1, 1, 0],
          }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear", repeatDelay: 0.6 }}
        />
      )}
    </svg>
  );
}
