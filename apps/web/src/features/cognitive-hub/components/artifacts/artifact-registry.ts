/**
 * Artifact Registry — extensible renderer lookup
 *
 * Generic registerArtifact<T> ensures each component is registered
 * with the correct typed artifact variant (Extract<HubArtifact, { type: T }>).
 *
 * The internal cast to ArtifactComponent is intentional and safe:
 * the registry guarantees it only calls each component with the matching type.
 *
 * @since Feb 2026
 */

import type { FC } from 'react';
import type { HubArtifact, ArtifactType } from '@arkelythex/shared/artifacts';

/** Public component contract — receives the full union for the dispatch layer */
export type ArtifactComponent = FC<{ artifact: HubArtifact }>;

const REGISTRY = new Map<ArtifactType, ArtifactComponent>();

/**
 * Register an artifact renderer.
 *
 * Generic constraint ensures the component's prop type matches the
 * specific HubArtifact variant for `type T`.
 */
export function registerArtifact<T extends ArtifactType>(
  type: T,
  component: FC<{ artifact: Extract<HubArtifact, { type: T }> }>
): void {
  // Safe cast: registry will always call this with artifact.type === T
  REGISTRY.set(type, component as ArtifactComponent);
}

/**
 * Retrieve the renderer for a given artifact type.
 * Returns null if the type was never registered.
 */
export function getRenderer(type: ArtifactType): ArtifactComponent | null {
  return REGISTRY.get(type) ?? null;
}
