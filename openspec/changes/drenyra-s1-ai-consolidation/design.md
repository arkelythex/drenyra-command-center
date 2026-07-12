# Design — S1: AI/Agent Ecosystem Consolidation (Updated)

## Architecture Decision

**Keep @drenyra/ai lean**: remove agents/, memory/, governance/, control-plane/. Consumers use @drenyra/pi for agent runtime instead.

**Keep @drenyra/drenyra-orchestrator stable**: its 8 files are Drenyra-specific routing. Only remove overlap with pi.

### PR1: Audit remaining ai/ contents (~200 lines)

1. List all exports from @drenyra/ai that overlap with @drenyra/pi
2. Find all consumers of those exports in the monorepo
3. Create migration map: old export → new import path

### PR2: Slim @drenyra/ai (~300 lines)

1. Remove agents/ directory (already in drenyra-pi)
2. Remove memory/ directory (already in drenyra-pi)
3. Remove governance/ directory (already in drenyra-pi)
4. Remove control-plane/ directory (already in drenyra-pi)
5. Update @drenyra/ai index.ts barrel exports
6. Add deprecation notices on removed exports (re-export from @drenyra/pi)

### PR3: Consumer migration (~200 lines)

1. Update apps/api imports that used removed ai/ paths → @drenyra/pi
2. Run typecheck across monorepo
3. Remove deprecated re-exports after verification
