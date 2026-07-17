# ADR-0002: Audit log append-only

## Status
Accepted

## Decision
All sensitive actions emit AuditEvents to an append-only log.
Evidence uses hashing to prove integrity.

## Why
Civic tech requires trust and post-facto verifiability.
