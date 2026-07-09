# Configure Engram for Drenyra

**Last updated**: 2026-07-08
**Content type**: Reference

Drenyra uses the `drenyra` Engram project name for persistent agent memory. Use this page to confirm the canonical project identity and local configuration path.

## Canonical project identity

Use these values when you configure or query Engram:

| Field              | Value                                               |
| ------------------ | --------------------------------------------------- |
| Project name       | `drenyra`                                           |
| Config path        | `~/Documents/PROYECTOS/drenyra/.engram/config.json` |
| Repository symlink | `drenyra/.engram` → `../.engram`                    |

## Rules

- Use `drenyra`, not `arkonyx` or `ARKONYX`
- Store project memories under project scope unless the content is personal preference
- Do not store secrets, production tokens, customer data, or raw fiscal records
- Record architecture decisions, non-obvious discoveries, bug fixes, and workflow changes

## Verification

Run the available Engram doctor command from your active agent runtime. If Engram is unavailable, continue with repo files and record the missing memory service in your final report.
