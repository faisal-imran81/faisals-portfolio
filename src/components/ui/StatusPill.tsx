import type { ProjectStatus } from "@/content/site";

const tone: Record<ProjectStatus, string> = {
  "In development": "text-acid border-acid/40",
  Live: "text-paper border-line-strong",
  Built: "text-paper-dim border-line-strong",
  Coursework: "text-paper-dim border-line-strong",
};

export function StatusPill({ status }: { status: ProjectStatus }) {
  const live = status === "Live";
  const dev = status === "In development";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] ${tone[status]}`}>
      <span
        className={`size-1.5 rounded-full ${dev ? "bg-acid animate-pulse-dot" : live ? "bg-[#6ee787]" : "bg-mute"}`}
        aria-hidden
      />
      {status}
    </span>
  );
}
