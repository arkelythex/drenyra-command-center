# Data Flow (v0)

```text
[Web/Apps/Bots] -> [API Gateway] -> [Application Use Cases] -> [Domain Model]
                        |                    |                    |
                        v                    v                    v
                   [AuthN/Z]            [Event Bus*]        [Policy Rules]
                        |                    |
                        v                    v
                   [Audit Log]        [Read Models/Search]
                        |
                        v
                [Observability Stack]
```

`*` Event bus is optional in MVP and introduced only when needed.

## Audit-first rule
- Write side validates commands and appends immutable audit events.
- Read side exposes transparency dashboards and operational views.
