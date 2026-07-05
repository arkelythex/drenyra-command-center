export const COGNITIVE_WORKSPACE_ACTION_EVENT = 'drenyra:cognitive-workspace-action';

export type CognitiveWorkspaceAction = 'start-mission';

interface CognitiveWorkspaceActionDetail {
  action: CognitiveWorkspaceAction;
}

export function dispatchCognitiveWorkspaceAction(action: CognitiveWorkspaceAction) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<CognitiveWorkspaceActionDetail>(COGNITIVE_WORKSPACE_ACTION_EVENT, {
      detail: { action },
    }),
  );
}

export function subscribeCognitiveWorkspaceActions(
  onAction: (action: CognitiveWorkspaceAction) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<CognitiveWorkspaceActionDetail>;
    if (customEvent.detail?.action) {
      onAction(customEvent.detail.action);
    }
  };

  window.addEventListener(COGNITIVE_WORKSPACE_ACTION_EVENT, listener);

  return () => {
    window.removeEventListener(COGNITIVE_WORKSPACE_ACTION_EVENT, listener);
  };
}
