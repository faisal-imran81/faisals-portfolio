import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RoninPreview } from "./RoninPreview";
import { CustomEntry } from "./CustomEntry";

// TEMPORARY evaluation page for the RONIN-04 asset (CC0, github.com/RamonLinares/atlas-09).
// Dev only — 404s in production builds. Delete with /public/preview once a decision is made.
export const metadata: Metadata = { title: "RONIN-04 preview", robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { mode } = await searchParams;
  return mode === "custom" ? <CustomEntry /> : <RoninPreview />;
}
