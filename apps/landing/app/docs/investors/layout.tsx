import type { Metadata } from "next";
import { docsMetadata } from "@/lib/seo/config";

export const metadata: Metadata = docsMetadata.investors;

export default function InvestorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
