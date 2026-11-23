import Link from "next/link";
import { Motif } from "@/components/ui/Motif";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[100svh] flex-col items-start justify-center gap-8 overflow-hidden px-[var(--gutter)]">
      <div className="pointer-events-none absolute inset-0 blueprint-grid" />
      <p className="relative label-mono">Error 404: page not found</p>
      <h1 className="relative display-xl">
        Broke <span className="font-serif font-normal italic text-paper-dim">this</span> one.
      </h1>
      <p className="relative max-w-md text-paper-dim">This page doesn&apos;t exist. Head back home and have a look around.</p>
      <Motif className="relative" highlight={1} />
      <Link href="/" className="relative rounded-full bg-acid px-6 py-3.5 font-medium text-ink transition-colors hover:bg-paper">
        Back home →
      </Link>
    </main>
  );
}
