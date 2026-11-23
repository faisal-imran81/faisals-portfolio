import Link from "next/link";
import type { ReactNode } from "react";
import { Magnetic } from "./Magnetic";

type Props = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  external?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function Button({ href, children, variant = "primary", external, className = "", ariaLabel }: Props) {
  const base =
    "group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-6 py-3.5 text-[0.9375rem] font-medium tracking-[-0.01em] transition-colors duration-500 ease-[var(--ease-out-expo)]";
  const styles =
    variant === "primary"
      ? "bg-acid text-ink hover:bg-paper"
      : "border border-line-strong text-paper hover:border-paper/50";
  const ext = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  const isHash = href.startsWith("#") || href.startsWith("mailto:");
  const inner = (
    <>
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden
        className="relative z-10 inline-block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
      >
        →
      </span>
    </>
  );

  return (
    <Magnetic>
      {isHash || external ? (
        <a href={href} className={`${base} ${styles} ${className}`} aria-label={ariaLabel} {...ext}>
          {inner}
        </a>
      ) : (
        <Link href={href} className={`${base} ${styles} ${className}`} aria-label={ariaLabel}>
          {inner}
        </Link>
      )}
    </Magnetic>
  );
}
