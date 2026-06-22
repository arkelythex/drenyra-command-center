import type { Metadata } from "next";
import { docsMetadata } from "@/lib/seo/config";

export const metadata: Metadata = docsMetadata.visuals;

export default function VisualsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
