# WelDX Compatibility Audit

**Date**: 2026-07-11
**Auditor**: forgeos-labs
**WelDX version**: latest (BAMWelDX/weldx)

## Summary

forge-schema JSON schemas are **not directly compatible** with WelDX, but a well-defined export path is feasible. forge-schema targets lightweight workshop capture; WelDX targets scientific research data. The differences are by design, not by accident.

## WelDX overview

WelDX is a Python library + ASDF file format for documenting experimental welding research data. Key characteristics:

- **Format**: ASDF (Advanced Scientific Data Format) — binary + YAML header
- **Domain**: Research laboratories, scientific reproducibility
- **Dependencies**: Python 3, xarray, pandas, pint (units), scipy, asdf
- **Strengths**: Physical units, coordinate transformations, measurement chains, ISO groove types, time series
- **Weaknesses**: Heavy toolchain (Python + conda), not mobile-friendly, designed for lab setups not field capture

## Schema comparison

### forge-schema → WelDX mapping

| forge-schema field              | WelDX analog                      | Mapping        | Notes                                                                    |
| ------------------------------- | --------------------------------- | -------------- | ------------------------------------------------------------------------ |
| `practice-session.sessionId`    | No direct analog                  | forge-specific | WelDX uses file-based identity                                           |
| `practice-session.date`         | `time/timestamp`                  | 1:1            | Same ISO 8601                                                            |
| `practice-session.welder`       | No direct analog                  | forge-specific | WelDX assumes lab context, not welder tracking                           |
| `practice-session.process`      | `aws/process/arc_welding_process` | 1:1            | Same AWS process enum                                                    |
| `practice-session.position`     | No direct analog                  | forge-specific | WelDX uses groove/joint geometry, not position                           |
| `practice-session.jointType`    | `groove/iso_9692_1_2013_12/*`     | Partial        | WelDX has detailed ISO groove types; forge uses simplified enum          |
| `practice-session.material`     | `aws/design/base_metal`           | Partial        | WelDX has detailed base metal specs; forge uses simpler type + thickness |
| `weld-record.electrode`         | `aws/process` parameters          | Partial        | WelDX models process params but not consumable tracking                  |
| `weld-record.settings.amperage` | Measurement chain signal          | 1:1            | Same physical quantity with units                                        |
| `weld-record.settings.voltage`  | Measurement chain signal          | 1:1            | Same physical quantity with units                                        |
| `weld-record.result.defects`    | Quality standards                 | Partial        | WelDX has quality standard references but not defect catalog             |
| `inspection-record`             | `measurement/measurement`         | Structural     | WelDX measurement chains are more formal                                 |
| `equipment-record`              | `equipment/measurement_equipment` | 1:1            | Similar scope                                                            |

### Fields with no WelDX analog

- Welder/supervisor identity (WelDX assumes lab/robot context)
- Session-level metadata (WelDX uses file identity)
- Position (1G-6G) — WelDX uses groove geometry instead
- Visual quality rating (1-5) — subjective, WelDX avoids this
- Arc sound descriptions — beyond WelDX scope
- Defect catalog with severity — WelDX references quality standards externally
- Photography references — WelDX focuses on measurement data, not visual documentation

### WelDX features not in forge-schema

- Coordinate transformations (robot kinematics)
- Measurement chains with error propagation
- ISO 9692-1 groove geometry (detailed V-groove, U-groove, etc.)
- Time series data (welding voltage/current over time)
- Physical units system (Pint)
- Multi-pass weld planning (fill sequence)

## Recommendation

**Strategy**: Maintain forge-schema as a lightweight capture format, with an export path to WelDX for research use.

**Rationale**:

1. forge-schema is designed for mobile/offline capture — JSON is universally parseable
2. WelDX requires Python + ASDF toolchain — inappropriate for workshop Android use
3. The fields overlap sufficiently (~70%) that a conversion script is straightforward
4. forge-schema captures data WelDX doesn't (welder tracking, arc sound, photography)
5. WelDX captures data forge-schema doesn't (coordinate transforms, measurement chains, groove geometry)

**Recommended action**: Create a `forge2weldx` conversion script under `experiments/weldx-export/` that:

1. Reads forge-schema JSON (single session or batch)
2. Maps compatible fields to WelDX ASDF structure
3. Flags forge-specific fields (welder, position, photos) as metadata annotations
4. Produces a valid WelDX file

**Not recommended**: Adopting WelDX as the primary format for workshop data. The toolchain dependency and format complexity would block adoption by the target audience (talleres de 2-20 personas, Android economico, conectividad irregular).

## Action Items

1. **Short term**: This audit is sufficient — proceed with forge-schema as defined
2. **Medium term**: Create `experiments/weldx-export/forge2weldx.py` once the first real dataset exists
3. **Long term**: If WelDX community interest exists, propose a forge-schema compatible extension to WelDX
