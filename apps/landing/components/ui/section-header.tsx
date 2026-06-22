import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  tagline: string;
  title: ReactNode;
  /** Optional second line or gradient span inside title */
  titleEmphasis?: ReactNode;
  description?: string;
  /** `id` del `<h2>` para `aria-labelledby` en la sección padre */
  headingId?: string;
  align?: "center" | "left";
  className?: string;
}

/**
 * Encabezado alineado con páginas marketing (/drenyra): eyebrow neutro
 * (`text-section-label`), título sólido y énfasis con `text-gradient-accent`.
 * título `font-display` y segunda línea en gradiente de marca.
 */
export function SectionHeader({
  tagline,
  title,
  titleEmphasis,
  description,
  headingId,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-12 space-y-4 md:mb-16",
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-left",
        className,
      )}
    >
      <span
        className={cn(
          "text-eyebrow-ds inline-block font-medium text-section-label uppercase tracking-wider",
          align === "center" ? "mx-auto" : undefined,
        )}
      >
        {tagline}
      </span>
      <h2
        id={headingId}
        data-section-heading
        tabIndex={-1}
        className="text-h2-ds text-balance font-display font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        {title}
        {titleEmphasis != null ? (
          <>
            <br />
            <span className="font-semibold italic text-gradient-accent">{titleEmphasis}</span>
          </>
        ) : null}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-body-lg-ds max-w-2xl text-pretty leading-relaxed text-muted-foreground",
            align === "center" ? "mx-auto" : undefined,
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
