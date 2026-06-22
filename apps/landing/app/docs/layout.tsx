import type { ReactNode } from "react";
import type { Metadata } from "next";

import { DocsChrome } from "@/components/docs/DocsChrome";
import { defaultMetadata, siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Documentación",
    template: `%s | ${siteConfig.name} Docs`,
  },
  description:
    "Design system, guías públicas y documentación técnica Arkelythex: inversores, arquitectura, compliance SUNAT y más.",
  openGraph: {
    title: `Documentación | ${siteConfig.name}`,
    description:
      "Design system, guías públicas y documentación técnica Arkelythex.",
    url: `${siteConfig.url}/docs`,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — Documentación`,
      },
    ],
  },
  twitter: {
    ...defaultMetadata.twitter,
    title: `Documentación | ${siteConfig.name}`,
    description:
      "Design system, guías públicas y documentación técnica Arkelythex.",
    images: [siteConfig.ogImage],
  },
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsChrome>{children}</DocsChrome>;
}
