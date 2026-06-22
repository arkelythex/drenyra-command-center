import type { Metadata } from "next";
import { docsMetadata } from "@/lib/seo/config";

export const metadata: Metadata = docsMetadata.sovereignCore;

export default function SovereignCoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
