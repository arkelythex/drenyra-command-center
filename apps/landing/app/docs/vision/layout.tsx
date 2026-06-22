import type { Metadata } from "next";
import { docsMetadata } from "@/lib/seo/config";

export const metadata: Metadata = docsMetadata.vision;

export default function VisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
