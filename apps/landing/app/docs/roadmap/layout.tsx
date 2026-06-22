import type { Metadata } from "next";
import { docsMetadata } from "@/lib/seo/config";

export const metadata: Metadata = docsMetadata.roadmap;

export default function RoadmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
