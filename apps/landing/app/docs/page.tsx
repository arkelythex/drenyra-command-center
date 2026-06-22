import { redirect } from "next/navigation";

/**
 * Hub legacy `/docs` → entrada pública canónica en API Docs.
 * Subrutas `/docs/*` siguen activas para referencia interna.
 */
export default function DocsIndexPage(): never {
	redirect("/api");
}
