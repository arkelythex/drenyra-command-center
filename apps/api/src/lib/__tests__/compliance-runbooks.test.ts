import { describe, expect, it } from 'vitest';
import { CPE_COMPLIANCE_INCIDENT_RUNBOOK, resolveCpeRunbook } from '../compliance-runbooks';

describe('resolveCpeRunbook', () => {
  it('returns undefined for non-incident lifecycle states', () => {
    const result = resolveCpeRunbook({
      currentStatus: 'ACCEPTED',
      timeline: [
        { stage: 'CREATED', status: 'DRAFT' },
        { stage: 'XML_VALIDATION', status: 'SUCCESS' },
      ],
    });

    expect(result).toBeUndefined();
  });

  it('returns canonical runbook for incident transaction statuses', () => {
    const result = resolveCpeRunbook({
      currentStatus: 'REJECTED',
      timeline: [],
    });

    expect(result).toEqual(CPE_COMPLIANCE_INCIDENT_RUNBOOK);
  });

  it('returns canonical runbook when timeline contains error events', () => {
    const result = resolveCpeRunbook({
      currentStatus: 'SUBMITTED',
      timeline: [{ stage: 'OSE_ATTEMPT', status: 'ERROR' }],
    });

    expect(result).toEqual(CPE_COMPLIANCE_INCIDENT_RUNBOOK);
  });
});
