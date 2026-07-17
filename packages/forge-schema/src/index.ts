// forge-schema — Open data schemas for physical processes
// Current domain: welding
// Future domains: electronics, drone, robotics, core

// Welding domain types
export type {
  PracticeSession,
  WeldingProcess,
  WeldingPosition,
  JointType,
  Material,
  Environment,
  WeldRecord,
  Electrode,
  WeldingSettings,
  ShieldingGas,
  WeldResult,
  PhotoRecord,
  Equipment,
  ExperienceLevel,
} from './types/welding'

// Re-export for convenience
export * as welding from './types/welding'
