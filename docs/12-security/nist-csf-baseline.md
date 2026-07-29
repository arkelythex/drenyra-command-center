# NIST CSF 2.0 Baseline Mapping — Drenyra

**Document type:** Security Baseline (NIST CSF 2.0 Self-Assessment)
**Status:** Phase 0 of `drenyra-security-foundation`
**Last updated:** 2026-07-25
**Review cadence:** Annually, or on significant architectural change

> **Disclaimer:** This document is a baseline self-assessment produced by the Drenyra engineering team. It does NOT constitute a formal NIST CSF certification, third-party attestation, or compliance audit. It is a planning tool to identify and prioritize security gaps.

---

## Scoring Legend

| Score                   | Meaning                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| **Satisfied**           | Control is fully implemented and verified in production              |
| **Partially Satisfied** | Control exists but has gaps in coverage, automation, or verification |
| **Missing**             | No meaningful implementation exists                                  |
| **N/A**                 | Not applicable to Drenyra's current operational context              |

---

## IDENTIFY (ID) — Asset Management, Risk, Governance

### ID.AM — Asset Management

| Subcategory | Description                                          | Score               | Rationale                                                                                                                                        |
| ----------- | ---------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID.AM-01    | Physical devices and systems inventoried             | Partially Satisfied | Infrastructure (Fly.io, Cloudflare R2, PostgreSQL) is documented but not in a formal CMDB. Dependencies tracked via `package.json` / `bun.lock`. |
| ID.AM-02    | Software platforms and apps inventoried              | Partially Satisfied | Monorepo provides partial inventory. Route Protection Matrix documents 31 API surfaces. No formal software inventory beyond repo.                |
| ID.AM-03    | Organizational communication and data flows mapped   | Satisfied           | STRIDE threat model (`threat-model.md`) maps all 8 trust boundaries and documents data flows for the critical fiscal transaction path.           |
| ID.AM-04    | External information systems catalogued              | Satisfied           | SUNAT API, AI providers (OpenAI/Anthropic/Gemini), banking providers (Prometeo) are documented in threat model.                                  |
| ID.AM-05    | Resources prioritized by classification, criticality | Satisfied           | Data classification scheme defined (Public → Regulated). Fiscal data is classified Regulated with the most stringent controls.                   |
| ID.AM-07    | Cyber supply chain risk management                   | Partially Satisfied | `drenyra-x6-supply-chain-security` SDD applied. Dependency scanning exists. No formal SBOM generation or vendor risk assessments.                |

### ID.BE — Business Environment

| Subcategory | Description                                    | Score               | Rationale                                                                                                                       |
| ----------- | ---------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| ID.BE-01    | Organization's role in supply chain            | Partially Satisfied | Drenyra serves as fiscal OS for Peruvian businesses. Role documented in project README. External dependency mapping incomplete. |
| ID.BE-03    | Mission, objectives, stakeholders communicated | Partially Satisfied | Product scope documented. Stakeholder security expectations not formally surveyed.                                              |
| ID.BE-05    | Resilience requirements for critical services  | Partially Satisfied | Recovery procedures exist for database (migration rollback). Full RTO/RPO not defined.                                          |

### ID.GV — Governance

| Subcategory | Description                                                      | Score               | Rationale                                                                                                                                      |
| ----------- | ---------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| ID.GV-01    | Organizational security policy established                       | Partially Satisfied | Security practices documented via SDD workflow, design docs, and threat model. No standalone security policy document.                         |
| ID.GV-02    | Security roles and responsibilities defined                      | Partially Satisfied | RBAC defines technical roles. Organizational security roles (CISO, incident commander) not formally assigned.                                  |
| ID.GV-03    | Legal/regulatory requirements (Peru: data protection) understood | Partially Satisfied | Peruvian fiscal regulations (SUNAT) well understood. Peruvian data protection law (Ley 29733) acknowledged in runbook but not formally mapped. |

### ID.RA — Risk Assessment

| Subcategory | Description                                                | Score               | Rationale                                                                                                                      |
| ----------- | ---------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| ID.RA-01    | Asset vulnerabilities identified and documented            | Missing             | No formal vulnerability assessment process. Threat model identifies architectural threats but not asset-level CVEs.            |
| ID.RA-02    | Threat intelligence from information-sharing forums        | Missing             | No ISAC/FIRST membership. Threat intelligence is ad-hoc.                                                                       |
| ID.RA-03    | Threats (internal and external) identified and documented  | Satisfied           | STRIDE threat model covers 30+ threat scenarios across 8 trust boundaries with severity and likelihood ratings.                |
| ID.RA-04    | Potential business impacts and likelihoods identified      | Satisfied           | Each threat scenario includes severity and likelihood assessment. Gap analysis in threat model prioritizes by business impact. |
| ID.RA-05    | Threats, vulnerabilities, likelihoods → risk determination | Partially Satisfied | Risk register in design doc. No formal quantitative risk analysis.                                                             |
| ID.RA-06    | Risk responses identified and prioritized                  | Partially Satisfied | Gap analysis in threat model maps each gap to a target phase. Prioritization exists but not regularly reviewed.                |

### ID.RM — Risk Management Strategy

| Subcategory | Description                                               | Score   | Rationale                                                                            |
| ----------- | --------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------ |
| ID.RM-01    | Risk management processes established, managed, agreed to | Missing | No formal risk management framework. Risk decisions are engineering-led.             |
| ID.RM-02    | Organizational risk tolerance determined                  | Missing | Risk tolerance not formally defined. Implicit tolerance based on SDD prioritization. |
| ID.RM-03    | Risk tolerance and risk appetite communicated             | Missing | No formal communication of risk posture.                                             |

### ID.SC — Supply Chain Risk Management

| Subcategory | Description                                           | Score               | Rationale                                                                                                                        |
| ----------- | ----------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| ID.SC-01    | Cyber supply chain risk management process identified | Partially Satisfied | `drenyra-x6` SDD establishes supply chain scanning. Not a formal SCRM program.                                                   |
| ID.SC-02    | Suppliers and third-party partners assessed           | Partially Satisfied | AI providers and SUNAT are the main third parties. SUNAT is government-mandated; AI providers assessed based on public policies. |
| ID.SC-04    | Suppliers and third-party monitoring                  | Missing             | No continuous monitoring of third-party security posture.                                                                        |

---

## PROTECT (PR) — Safeguards

### PR.AA — Identity Management, Authentication, and Access Control

| Subcategory | Description                                                         | Score               | Rationale                                                                                                                                      |
| ----------- | ------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| PR.AA-01    | Identities and credentials managed for authorized devices and users | Satisfied           | BetterAuth handles user identity. bcrypt (cost 10) for password hashing. HTTP-only cookies for sessions. API keys managed through auth module. |
| PR.AA-02    | Physical access to assets managed and protected                     | N/A                 | Cloud-native (Fly.io). Physical security delegated to cloud provider.                                                                          |
| PR.AA-03    | Remote access managed                                               | Satisfied           | API is the sole access point for all operations (no direct DB access in production). TLS enforced.                                             |
| PR.AA-04    | Access permissions and authorizations managed                       | Partially Satisfied | Dual RBAC systems exist (System 1: infrastructure/auth, System 2: API security). Not unified. Phase 1 of this SDD addresses this.              |
| PR.AA-05    | Network integrity protected                                         | Satisfied           | TLS 1.3, HSTS, SameSite cookies, network isolation (VPC-like on Fly.io).                                                                       |
| PR.AA-06    | Identity proofed, asserted, and bound to credentials                | Satisfied           | Email verification via BetterAuth. RUC validation for Peruvian taxpayers. RLS database context binds user to tenant.                           |

### PR.AT — Awareness and Training

| Subcategory | Description                                          | Score   | Rationale                                                   |
| ----------- | ---------------------------------------------------- | ------- | ----------------------------------------------------------- |
| PR.AT-01    | Personnel trained on security awareness              | Missing | No formal security training program.                        |
| PR.AT-02    | Privileged users understand roles & responsibilities | Missing | No documented training for superadmin/admin role holders.   |
| PR.AT-04    | Senior leadership understands security roles         | Missing | Engineering-driven security; leadership awareness informal. |

### PR.DS — Data Security

| Subcategory | Description                                    | Score               | Rationale                                                                                                               |
| ----------- | ---------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| PR.DS-01    | Data-at-rest protected                         | Satisfied           | AES-256-GCM field-level encryption for fiscal data. PostgreSQL encryption. R2 server-side encryption.                   |
| PR.DS-02    | Data-in-transit protected                      | Satisfied           | TLS 1.3 for all external communication. Internal API ↔ DB uses TLS where available.                                     |
| PR.DS-05    | Protections against data leaks                 | Partially Satisfied | Pre-commit secret detection (Phase 3). No DLP solution. Log redaction via `secure-logger`.                              |
| PR.DS-06    | Integrity checking mechanisms                  | Satisfied           | Hash chain audit trail (`compute-audit-hash.ts` + `hash-chain.vo.ts`). Content-addressed storage for evidence.          |
| PR.DS-07    | Development and testing environments separated | Partially Satisfied | Separate dev/staging/prod environments. Dev DB seeded with synthetic data. No formal data masking of prod data for dev. |
| PR.DS-08    | Integrity checking hardware (HSM, TPM)         | N/A                 | No hardware security modules in current cloud architecture.                                                             |
| PR.DS-10    | Data-at-rest protected — confidentiality       | Satisfied           | AES-256-GCM for fiscal data. Encryption passphrase managed by user (DRENYRA_MASTER_KEY).                                |
| PR.DS-11    | Data-in-transit protected — confidentiality    | Satisfied           | TLS 1.3 with modern cipher suites.                                                                                      |

### PR.IR — Technology Infrastructure Resilience

| Subcategory | Description                                         | Score               | Rationale                                                                                  |
| ----------- | --------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------ |
| PR.IR-01    | Technology infrastructure resilience requirements   | Partially Satisfied | Circuit breaker for SUNAT API. Retry queue with backoff. No formal resilience testing.     |
| PR.IR-02    | Server and data storage protection                  | Satisfied           | Fly.io infrastructure with automated instance management. R2 storage with access controls. |
| PR.IR-04    | Adequate capacity to meet availability requirements | Partially Satisfied | Fly.io auto-scaling. No formal capacity planning or load testing.                          |

### PR.MA — Maintenance

| Subcategory | Description                                        | Score               | Rationale                                                                                                            |
| ----------- | -------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| PR.MA-01    | Assets maintained per manufacturer specifications  | Partially Satisfied | Regular dependency updates via `bun update`. CI runs `bun run typecheck` + tests. No formal patch management policy. |
| PR.MA-02    | Maintenance approvals, logging, and non-disruption | Partially Satisfied | CI/CD pipeline controls deployments. No formal change management or maintenance windows.                             |

### PR.PS — Platform Security

| Subcategory | Description                                                   | Score               | Rationale                                                                                                              |
| ----------- | ------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| PR.PS-01    | Configuration management practices established                | Partially Satisfied | Environment variables managed per environment. No Infrastructure-as-Code (fly.toml exists but is not declarative IaC). |
| PR.PS-04    | Log records managed per policy                                | Satisfied           | Audit log with hash chain integrity. Auth events logged to `auth_audit_logs`. Access logs via `logSecurityAccess`.     |
| PR.PS-05    | Installation and execution of unauthorized software prevented | Partially Satisfied | Monorepo with bun workspaces controls dependencies. No application control / allowlisting in runtime.                  |
| PR.PS-06    | Secure software development practices                         | Partially Satisfied | SDD workflow. CI gates (typecheck, lint, test). Pre-commit hooks. No formal SAST/DAST.                                 |

---

## DETECT (DE) — Continuous Monitoring

### DE.AE — Anomalies and Events

| Subcategory | Description                                               | Score   | Rationale                                                                                          |
| ----------- | --------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| DE.AE-02    | Potentially adverse events analyzed                       | Missing | Access logs exist but no automated analysis for anomalies. Phase 4 documents alert triggers.       |
| DE.AE-03    | Event data collected and correlated from multiple sources | Missing | Auth events, access logs, and error logs are separate. No SIEM/correlation.                        |
| DE.AE-04    | Impact of events determined                               | Missing | No automated impact assessment.                                                                    |
| DE.AE-05    | Incident alert thresholds established                     | Missing | Alert triggers defined in Phase 4 monitoring strategy (`monitoring-strategy.md`). Not implemented. |

### DE.CM — Continuous Monitoring

| Subcategory | Description                                  | Score               | Rationale                                                                                                                   |
| ----------- | -------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| DE.CM-01    | Networks monitored                           | Missing             | Fly.io provides basic metrics. No network-level monitoring or IDS.                                                          |
| DE.CM-02    | Physical environment monitored               | N/A                 | Cloud-native — not applicable.                                                                                              |
| DE.CM-03    | Personnel activity monitored                 | Missing             | No insider threat monitoring. Admin actions not specifically alerted.                                                       |
| DE.CM-06    | External service provider activity monitored | Partially Satisfied | AI provider usage is logged (agent audit trail). SUNAT API responses logged. Banking provider integration logging is basic. |
| DE.CM-08    | Vulnerability scans performed                | Partially Satisfied | Dependabot/Renovate for dependency scanning. No application-level vulnerability scanning.                                   |
| DE.CM-09    | Unauthorized mobile code detected            | N/A                 | No mobile code execution in server-side environment.                                                                        |

---

## RESPOND (RS) — Incident Response

### RS.MA — Incident Management

| Subcategory | Description                                              | Score   | Rationale                                                                  |
| ----------- | -------------------------------------------------------- | ------- | -------------------------------------------------------------------------- |
| RS.MA-01    | Incident response plan executed during/after incident    | Missing | No formal incident response plan. Phase 4 of this SDD creates the runbook. |
| RS.MA-03    | Recovery activities communicated with stakeholders       | Missing | No communication plan or templates.                                        |
| RS.MA-05    | Voluntary information sharing with external stakeholders | Missing | Not established.                                                           |

### RS.AN — Analysis

| Subcategory | Description                                                           | Score   | Rationale                                                                                          |
| ----------- | --------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| RS.AN-03    | Incidents analyzed for effective response                             | Missing | No formal incident investigation process.                                                          |
| RS.AN-06    | Actions performed during incident investigation recorded in forensics | Missing | No forensic capability. Audit trail provides post-hoc analysis but not real-time forensic capture. |
| RS.AN-07    | Incident data correlated from multiple sources                        | Missing | No SIEM/correlation capability.                                                                    |
| RS.AN-08    | Impact of incidents determined                                        | Missing | No business impact analysis process for security incidents.                                        |

### RS.CO — Communications

| Subcategory | Description                                      | Score   | Rationale                                                                         |
| ----------- | ------------------------------------------------ | ------- | --------------------------------------------------------------------------------- |
| RS.CO-02    | Incident response coordination with stakeholders | Missing | Runbook (Phase 4) templates define notification content. Not practiced.           |
| RS.CO-03    | Reporting requirements met                       | Missing | Peruvian data protection law (Ley 29733) notification requirements not automated. |

### RS.MI — Mitigation

| Subcategory | Description                                | Score               | Rationale                                                                                                                    |
| ----------- | ------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| RS.MI-01    | Incidents contained                        | Partially Satisfied | Rate limiting contains brute force. Session invalidation contains credential compromise. No automated containment playbooks. |
| RS.MI-02    | Incidents mitigated                        | Partially Satisfied | Password reset flow. Feature flag rollback for RBAC/MFA. No automated mitigation.                                            |
| RS.MI-03    | Newly identified vulnerabilities mitigated | Partially Satisfied | Dependency updates address known CVEs. No vulnerability management process beyond dependency scanning.                       |

---

## RECOVER (RC) — Recovery

### RC.RP — Recovery Planning

| Subcategory | Description                                        | Score   | Rationale                                                                         |
| ----------- | -------------------------------------------------- | ------- | --------------------------------------------------------------------------------- |
| RC.RP-01    | Recovery plan executed during or after an incident | Missing | No formal recovery plan. Database migration rollback provides partial capability. |
| RC.RP-02    | Recovery actions selected, scoped, prioritized     | Missing | Not defined.                                                                      |
| RC.RP-05    | Adequate resource capacity for recovery ensured    | Missing | Not assessed.                                                                     |
| RC.RP-06    | Restoration activities communicated                | Missing | No communication plan for recovery events.                                        |

### RC.CO — Recovery Communications

| Subcategory | Description                                       | Score   | Rationale             |
| ----------- | ------------------------------------------------- | ------- | --------------------- |
| RC.CO-03    | Recovery activities coordinated with stakeholders | Missing | No coordination plan. |
| RC.CO-04    | Restoration verified and tested                   | Missing | No recovery testing.  |

---

## Prioritized Gap Summary

Gaps are ordered by business impact (P0 = highest priority, P3 = lowest).

| Priority | Subcategory | Current Score       | Recommended Remediation                                                                                                                      | Effort | Addressed By                        |
| -------- | ----------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------- |
| **P0**   | ID.RA-01    | Missing             | Implement dependency vulnerability scanning in CI; create asset-level CVE tracking                                                           | Low    | Partially done via supply chain SDD |
| **P0**   | PR.AA-04    | Partially Satisfied | Unify dual RBAC systems into single hierarchy with canonical permission matrix                                                               | High   | **Phase 1 — this SDD**              |
| **P0**   | DE.AE-05    | Missing             | Implement alerting on security events defined in Phase 4 monitoring strategy                                                                 | Medium | Phase 4                             |
| **P0**   | RS.MA-01    | Missing             | Create and practice incident response runbook with 4 playbooks (credential compromise, brute force, data exfiltration, privilege escalation) | Medium | **Phase 4 — this SDD**              |
| **P1**   | PR.DS-05    | Partially Satisfied | Deploy pre-commit secret detection; implement vault-ready SecretProvider abstraction; migrate to Infisical                                   | Medium | **Phase 3 — this SDD**              |
| **P1**   | DE.AE-02    | Missing             | Establish structured logging with anomaly detection (Vector/ClickHouse); define alert thresholds and routing                                 | High   | Phase 4                             |
| **P1**   | DE.CM-01    | Missing             | Deploy application-level monitoring; implement health-check endpoint with security metrics exposure                                          | Medium | Phase 4                             |
| **P1**   | RS.MI-01    | Partially Satisfied | Automate containment actions (IP blocking, session revocation) linked to alert triggers                                                      | High   | Future                              |
| **P2**   | PR.AT-01    | Missing             | Develop security awareness training for engineering team; document security onboarding checklist                                             | Medium | Roadmap                             |
| **P2**   | RC.RP-01    | Missing             | Define recovery plan with RTO/RPO for critical services; test annually                                                                       | Medium | Roadmap                             |
| **P2**   | ID.RM-01    | Missing             | Establish lightweight risk management framework; document risk tolerance and register                                                        | Medium | Roadmap                             |
| **P3**   | ID.SC-04    | Missing             | Implement third-party vendor monitoring; establish SBOM generation as part of CI                                                             | Medium | Roadmap                             |
| **P3**   | PR.AT-04    | Missing             | Present security posture to leadership; establish quarterly security review cadence                                                          | Low    | Roadmap                             |

---

## Summary Statistics

| Function      | Satisfied | Partially Satisfied | Missing | N/A   | Total  |
| ------------- | --------- | ------------------- | ------- | ----- | ------ |
| IDENTIFY (ID) | 5         | 10                  | 5       | 0     | 20     |
| PROTECT (PR)  | 10        | 12                  | 3       | 2     | 27     |
| DETECT (DE)   | 0         | 2                   | 7       | 1     | 10     |
| RESPOND (RS)  | 0         | 2                   | 9       | 0     | 11     |
| RECOVER (RC)  | 0         | 0                   | 7       | 0     | 7      |
| **TOTAL**     | **15**    | **26**              | **31**  | **3** | **75** |

**Overall coverage:** 55% of applicable subcategories have at least partial implementation (15 + 26 of 72 applicable). 31 subcategories (43%) are completely missing.

---

> **Self-Assessment Note:** This baseline was prepared by the Drenyra engineering team as an internal planning tool. It is not a certification, compliance audit, or third-party attestation. Scores reflect the team's honest assessment as of July 2026.
