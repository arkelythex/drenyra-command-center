# Review Lens: Resilience

> **Trigger**: review-resilience, resilience-review, error-handling, retry, timeout, fallback
> **Scope**: `project`

## Purpose

Shell/process integration, partial failures, recovery, and degraded dependencies review lens. Run before merging changes involving external API calls, background jobs, retry logic, or error recovery.

## Review Checklist

### Error Handling

- [ ] All external API calls have timeout configuration
- [ ] SUNAT API calls have retry with exponential backoff
- [ ] No silent catch blocks — every catch logs or re-throws
- [ ] Error messages are actionable and user-facing when appropriate
- [ ] Validation errors expose which rule was violated

### Partial Failure Recovery

- [ ] Batch operations handle partial success/failure gracefully
- [ ] Database transactions have rollback on error
- [ ] Pipeline gates fail STOP when BLOCKING gates fail
- [ ] Evidence store saves partial results before pipeline failure

### Degraded Dependencies

- [ ] External service failures have fallback behavior (cache, default, degrade)
- [ ] Feature flags gate behavior that depends on unreliable services
- [ ] Circuit breaker or backpressure for high-volume integrations
- [ ] Graceful degradation documented in API responses

### Concurrency & Race Conditions

- [ ] Fiscal operations are idempotent or have idempotency keys
- [ ] Concurrent requests to SUNAT APIs are rate-limited
- [ ] No TOCTOU (time-of-check-time-of-use) bugs in fiscal scope validation
- [ ] Background jobs deduplicate by RUC + period + document series

### Process Integration

- [ ] CLI commands handle SIGTERM/SIGINT for clean shutdown
- [ ] Pipeline processes clean up temporary files
- [ ] Subprocess exit codes are checked
- [ ] Long-running jobs report progress for monitoring

## Ledger Format

```json
{
  "id": "RESL-001",
  "location": "path/to/file.ts:42",
  "severity": "BLOCKER | CRITICAL | WARNING | SUGGESTION",
  "status": "open | fixed | verified | wont-fix",
  "evidence": "Why it matters",
  "fix": "How to fix it"
}
```
