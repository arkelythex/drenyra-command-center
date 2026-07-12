import { generateProposal } from '../proposal';
import { improvementAreas } from '../improvement-areas';

describe('generateProposal', () => {
  it('should return a proposal with correct title', () => {
    const proposal = generateProposal();
    expect(proposal.title).toBe('[auto-sdd] Weekly improvement proposal');
  });

  it('should include all improvement areas', () => {
    const proposal = generateProposal();
    expect(proposal.areas).toEqual(improvementAreas);
  });

  it('should have three next steps', () => {
    const proposal = generateProposal();
    expect(proposal.nextSteps.length).toBe(3);
  });

  it('should contain merge-health in body', () => {
    const proposal = generateProposal();
    expect(proposal.body).toContain('merge-health');
  });

  it('should contain the total issues count', () => {
    const proposal = generateProposal();
    const total = improvementAreas.reduce((sum, area) => sum + area.issues, 0);
    expect(proposal.body).toContain(`Total issues analyzed: ${total}`);
  });
});
