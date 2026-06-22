import type { Metadata } from "next";
import { docsMetadata } from "@/lib/seo/config";

export const metadata: Metadata = docsMetadata.designSystem;

export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
