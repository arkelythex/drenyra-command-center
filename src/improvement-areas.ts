export interface ImprovementArea {
  name: string;
  issues: number;
  description: string;
}

export const improvementAreas: ImprovementArea[] = [
  {
    name: 'Address root causes of recurring bugs',
    issues: 0,
    description: 'Investigate and fix underlying causes of bug issues to prevent recurrence.'
  },
  {
    name: 'Reduce tech debt',
    issues: 0,
    description: 'Refactor code, improve architecture, and pay down technical debt.'
  },
  {
    name: 'Improve merge health',
    issues: 1,
    description: 'Enhance CI/CD, testing, and review processes to reduce merge conflicts and failures.'
  },
  {
    name: 'Review judgment day findings',
    issues: 0,
    description: 'Analyze and act on judgment day analysis results to improve system reliability.'
  }
];
