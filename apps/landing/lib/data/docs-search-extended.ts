/**
 * Entradas extra para la paleta de búsqueda de /docs (sin full-text).
 * Cuando el sitio supere decenas de páginas, evaluar Pagefind (@pagefind/cli)
 * o Algolia DocSearch y mantener este índice como bootstrap o redirect.
 */

import { designSystemTokenSections } from "@/lib/design-system-token-contract";

export type DocsSearchEntryExtended = {
  label: string;
  href: string;
  group: string;
};

export function getExtendedDocsSearchEntries(): DocsSearchEntryExtended[] {
  const tokenEntries: DocsSearchEntryExtended[] = designSystemTokenSections.map((s) => ({
    label: `${s.title} (tokens)`,
    href: `/docs/design-system#${s.category}`,
    group: "Design System — referencia",
  }));

  const staticEntries: DocsSearchEntryExtended[] = [
    { label: "Vista general (Design System)", href: "/docs/design-system#overview", group: "Design System" },
    { label: "Filosofía visual", href: "/docs/design-system#filosofia", group: "Design System" },
    { label: "Principios de interfaz", href: "/docs/design-system#principios", group: "Design System" },
    { label: "Elevación y motion", href: "/docs/design-system#efectos-motion", group: "Design System" },
    { label: "Componentes (UI)", href: "/docs/design-system#componentes", group: "Design System" },
    { label: "Patrones de layout", href: "/docs/design-system#patrones", group: "Design System" },
    { label: "Paleta (media kit)", href: "/docs/visuals#colores", group: "Media Kit" },
    { label: "Tipografía (media kit)", href: "/docs/visuals#tipografia", group: "Media Kit" },
    { label: "Voz de marca", href: "/docs/visuals#voz-marca", group: "Media Kit" },
    { label: "Ilustración", href: "/docs/visuals#ilustraciones", group: "Media Kit" },
    { label: "Fotografía", href: "/docs/visuals#fotografia", group: "Media Kit" },
    { label: "Accesibilidad", href: "/docs/visuals#accesibilidad", group: "Media Kit" },
  ];

  return [...staticEntries, ...tokenEntries];
}
