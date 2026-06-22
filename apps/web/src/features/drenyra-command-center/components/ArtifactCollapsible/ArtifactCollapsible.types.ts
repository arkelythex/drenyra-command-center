import type { HubArtifact } from "../../../cognitive-hub/types/hub.types";

export type DensityMode = "compact" | "detail" | "numbers-only";

export interface ArtifactCollapsibleProps {
  artifact: HubArtifact;
  density: DensityMode;
  isPinned: boolean;
  onPin: (id: string) => void;
  onFocus: (artifact: HubArtifact) => void;
  /** Llamado cuando el usuario hace clic en "Crear caso desde artifact" */
  onCreateCase?: (artifact: HubArtifact) => void;
}
