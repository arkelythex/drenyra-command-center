import type { Metadata } from "next";
import { docsMetadata } from "@/lib/seo/config";

export const metadata: Metadata = docsMetadata.sunatCompliance;

export default function SunatComplianceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
