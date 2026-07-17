// forge-schema welding domain — TypeScript interfaces
// Canonical source. These mirror welding/*.schema.json.

export interface PracticeSession {
  sessionId: string
  date: string
  welder: Person
  supervisor?: Person & { notes?: string }
  process: WeldingProcess
  position: WeldingPosition
  jointType: JointType
  material: Material
  environment?: Environment
  beads: WeldRecord[]
  totalTimeMinutes?: number
  notes?: string
}

export interface Person {
  alias: string
  experience?: ExperienceLevel
}

export type ExperienceLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'professional'

export type WeldingProcess = 'SMAW' | 'GMAW' | 'GTAW' | 'FCAW' | 'SAW'

export type WeldingPosition = '1G' | '2G' | '3G' | '4G' | '5G' | '6G'

export type JointType = 'butt' | 'lap' | 'tee' | 'corner' | 'edge'

export interface Material {
  type: string
  thicknessMm: number
  condition?: string
}

export interface Environment {
  indoor?: boolean
  temperature?: number
  humidity?: number
  ventilation?: 'natural' | 'forced' | 'extraction' | 'none'
}

export interface WeldRecord {
  beadId: string
  passNumber: number
  process: WeldingProcess
  electrode: Electrode
  settings: WeldingSettings
  shieldingGas?: ShieldingGas
  jointPreparation?: string
  result: WeldResult
  photos: PhotoRecord[]
  comments?: string
}

export interface Electrode {
  classification: string
  diameterMm: number
  brand?: string
  storageCondition?: 'sealed' | 'open' | 'reconditioned' | 'unknown'
}

export interface WeldingSettings {
  amperage: number
  voltage?: number
  wireFeedSpeed?: number
  travelSpeed?: number
  polarity: 'DCEN' | 'DCEP' | 'AC'
}

export interface ShieldingGas {
  composition: string
  flowRate?: number
}

export interface WeldResult {
  visualQuality: number
  defects: string[]
  notes?: string
}

export interface PhotoRecord {
  photoId: string
  /** Blob data stored in IndexedDB, not serialized in JSON export */
  data?: ArrayBuffer
  type: 'bead_face' | 'bead_profile' | 'root' | 'setup' | 'other'
  caption?: string
}

export interface Equipment {
  equipmentId: string
  make: string
  model: string
  type:
    | 'transformer'
    | 'rectifier'
    | 'inverter'
    | 'engineDriven'
    | 'multiProcess'
  processes: WeldingProcess[]
  serialNumber?: string
  year?: number
  notes?: string
}
