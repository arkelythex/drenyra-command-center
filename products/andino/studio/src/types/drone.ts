export interface DroneDesign {
  frameType: 'quad' | 'y6' | 'x8' | 'hexa' | 'octo';
  armLength: number;
  armAngle: number;
  motorCount: number;
  motorModel: string;
  propellerDiameter: number;
  propellerPitch: number;
  batteryCells: number;
  batteryCapacity: number;
  frameMaterial: 'carbon' | 'aluminum' | 'pla' | 'petg';
  payloadMass: number;
  auw: number;
  totalThrust: number;
  twr: number;
  flightTimeMin: number;
  costUsd: number;
}

export interface Telemetry {
  lat: number;
  lon: number;
  altitude: number;
  speed: number;
  voltage: number;
  current: number;
  batteryPercent: number;
  gpsSats: number;
  flightMode: string;
}

export interface Mission {
  id: string;
  name: string;
  status: 'planning' | 'in_flight' | 'completed' | 'failed';
  startedAt: string;
  droneDesign?: DroneDesign;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

export interface AgentEvent {
  id: string;
  timestamp: string;
  agent: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}
