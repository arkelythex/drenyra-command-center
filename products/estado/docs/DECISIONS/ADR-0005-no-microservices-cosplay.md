# ADR-0005: No microservices cosplay

## Status
Accepted

## Decision
Keep a modular monolith architecture while the product and domain are still converging.
Adopt service decomposition only when supported by measurable operational constraints
(e.g. scaling bottlenecks, independent deployment needs, team ownership boundaries).

## Why
Premature distribution increases complexity and incident surface without clear value.
The dual MVP can ship faster and safer with strict internal module boundaries first.
