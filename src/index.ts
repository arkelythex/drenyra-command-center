import { generateProposal } from './proposal';

function main(): void {
  const proposal = generateProposal();
  console.log('=== Auto-SDD Weekly Improvement Proposal ===');
  console.log('Title:', proposal.title);
  console.log('\nBody:');
  console.log(proposal.body);
  console.log('\n=== Next Steps ===');
  proposal.nextSteps.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
  });
}

main();
