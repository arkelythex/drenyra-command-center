# Incident Response v1

## Severity levels
- Sev-1: critical outage, data integrity/security risk, or broad user impact.
- Sev-2: major degraded functionality with strong user impact.
- Sev-3: limited degradation with workaround.
- Sev-4: minor issue, no significant user impact.

## Response targets
- Sev-1: acknowledge <= 15 minutes, mitigation <= 60 minutes.
- Sev-2: acknowledge <= 30 minutes, mitigation <= 4 hours.
- Sev-3: acknowledge <= 1 business day.
- Sev-4: triage in backlog.

## Incident command structure
- Incident Commander (IC): owns timeline, decisions, comms cadence.
- Ops/Infra Lead: infra diagnostics and mitigations.
- App Lead: API/app behavior diagnosis and rollback/fix.
- Communications Lead: status updates and postmortem owner.

## Process
1. Detect and classify severity.
2. Open incident issue using `incident_report.md` template.
3. Assign IC and owners.
4. Stabilize service (mitigate first, then root cause).
5. Communicate updates every 30 min for Sev-1/2.
6. Close incident only after validation and monitoring stability.
7. Publish postmortem within 5 business days for Sev-1/2.

## Required evidence
- Timeline (UTC timestamps)
- Trace IDs / log excerpts
- Affected endpoints/flows
- Mitigation and rollback actions

## Communication channels
- Internal: maintainers channel + incident issue.
- External: GitHub status update issue/discussion when public impact exists.
