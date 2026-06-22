import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/config";

/**
 * Dynamic Sitemap.xml for Next.js 15 App Router
 * 2026 SEO Best Practices
 */

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    // Landing pages
    { path: "/", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/sire", priority: 0.95, changeFrequency: "weekly" as const },
    { path: "/drenyra", priority: 0.95, changeFrequency: "weekly" as const },
    { path: "/demo", priority: 0.95, changeFrequency: "weekly" as const },
    { path: "/seguridad", priority: 0.85, changeFrequency: "weekly" as const },

    // Conversion pages
    { path: "/precios", priority: 0.95, changeFrequency: "weekly" as const },
    { path: "/casos-de-exito", priority: 0.85, changeFrequency: "monthly" as const },
    { path: "/nosotros", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/cookies", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/legal", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },

    // Product ecosystem
    { path: "/api", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/civic", priority: 0.8, changeFrequency: "weekly" as const },

    // Docs - Public (índice en /api; subpáginas legacy)
    { path: "/docs/design-system", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/docs/investors", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/docs/vision", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/docs/roadmap", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/docs/visuals", priority: 0.7, changeFrequency: "monthly" as const },

    // Docs - Technical
    { path: "/docs/architecture", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/docs/sovereign-core", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/docs/sunat-compliance", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/docs/cbdc-banking", priority: 0.7, changeFrequency: "monthly" as const },
  ];

  return routes.map((route) => ({
    url: `${siteConfig.url}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
