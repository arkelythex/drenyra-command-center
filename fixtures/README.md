# Drenyra Golden Protocol Fixtures

Cross-language test vectors for the mission protocol.
Every fixture is consumed by both Go and TypeScript tests to verify
identical interpretation of the protocol.

## Structure

```
fixtures/
├── README.md                  ← This file
├── canonicalization-vectors.json  ← Cross-language JSON fixtures
│
├── missions/                  ← Mission lifecycle fixtures
│   ├── mission-created.v1.json
│   ├── mission-running.v1.json
│   ├── mission-blocked.v1.json
│   ├── mission-awaiting-approval.v1.json
│   ├── mission-approved.v1.json
│   ├── mission-completed.v1.json
│   └── mission-failed.v1.json
│
├── errors/                    ← Error envelope fixtures
│   ├── error-version-conflict.v1.json
│   ├── error-not-found.v1.json
│   ├── error-unauthorized.v1.json
│   └── error-gate-blocking.v1.json
│
└── receipts/                  ← Receipt verification fixtures
    ├── receipt-valid.v1.json
    ├── receipt-tampered.v1.json
    └── receipt-signature.v1.json    (future)
```

## Usage

### TypeScript

```ts
import snapshot from "../../fixtures/missions/mission-created.v1.json";
```

### Go

```go
import _ "embed"
//go:embed ../../fixtures/missions/mission-created.v1.json
var missionCreatedFixture []byte
```

## Canonicalization Vectors

`canonicalization-vectors.json` defines input → expected hash pairs
that must produce identical results in both Go and TypeScript.

Each vector tests:

- Key-sorted JSON serialization
- Unicode normalization (NFD canonical)
- Number representation
- Null handling
- Array sorting

## Adding a Fixture

1. Create the JSON file in the appropriate subdirectory
2. Add the fixture reference to canonicalization-vectors.json
3. Add cross-language test in both Go and TypeScript test suites
4. Run both test suites to confirm identical interpretation
