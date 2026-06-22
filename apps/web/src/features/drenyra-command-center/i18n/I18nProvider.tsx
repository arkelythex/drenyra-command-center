import { type ReactNode, Suspense } from "react";

interface I18nProviderProps {
  children: ReactNode;
}

/**
 * Wraps children with <Suspense> for i18next async readiness.
 * i18next needs a Suspense boundary when loading resources asynchronously.
 *
 * Usage: wrap the root of DrenyraCommandCenter with this provider.
 */
export function I18nProvider({ children }: I18nProviderProps) {
  return (
    <Suspense fallback={null}>
      {children}
    </Suspense>
  );
}
