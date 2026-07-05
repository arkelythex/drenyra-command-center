import { useKnowledgeStore } from '@/features/agent-swarm/hooks/useKnowledgeStore';
import { useSkillStore } from '@/features/agent-swarm/hooks/useSkillStore';
import { HubRightRail } from './hub-right-rail';
import type { HubArtifact } from '@drenyra/shared/artifacts';

interface HubRightRailContainerProps {
  activeArtifact: HubArtifact | null;
  showHistory: boolean;
  isSwarmStreaming: boolean;
  onCloseArtifact: () => void;
}

export const HubRightRailContainer = ({
  activeArtifact,
  showHistory,
  isSwarmStreaming,
  onCloseArtifact,
}: HubRightRailContainerProps) => {
  const skills = useSkillStore((s) => s.skills);
  const installSkill = useSkillStore((s) => s.installSkill);
  const { documents } = useKnowledgeStore();

  return (
    <HubRightRail
      activeArtifact={activeArtifact}
      showHistory={showHistory}
      isSwarmStreaming={isSwarmStreaming}
      skills={skills}
      documents={documents}
      onCloseArtifact={onCloseArtifact}
      onInstallSkill={installSkill}
    />
  );
};
