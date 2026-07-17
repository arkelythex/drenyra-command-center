import { DroneDesign, Telemetry, Mission, ChatMessage, AISuggestion } from '@/types/drone';

export const mockDroneDesign: DroneDesign = {
  frameType: 'y6',
  armLength: 250,
  armAngle: 38,
  motorCount: 6,
  motorModel: '2205 2300KV',
  propellerDiameter: 9,
  propellerPitch: 4.5,
  batteryCells: 4,
  batteryCapacity: 2200,
  frameMaterial: 'carbon',
  payloadMass: 240,
  auw: 680,
  totalThrust: 1440,
  twr: 2.1,
};

export const mockTelemetry: Telemetry = {
  lat: -33.456,
  lon: -70.615,
  altitude: 45.2,
  speed: 12.8,
  voltage: 15.6,
  current: 8.2,
  batteryPercent: 78,
  gpsSats: 4,
  flightMode: 'AUTO',
};

export const mockMissions: Mission[] = [
  {
    id: 'DFT-04',
    name: 'Tunnel Inspection Alpha',
    status: 'in_flight',
    startedAt: '2026-06-21T14:22:00Z',
  },
  {
    id: 'DFT-03',
    name: 'Bridge Girder Survey',
    status: 'completed',
    startedAt: '2026-06-19T09:00:00Z',
  },
  {
    id: 'DFT-02',
    name: 'Mine Shaft Mapping',
    status: 'completed',
    startedAt: '2026-06-17T11:30:00Z',
  },
  {
    id: 'DFT-01',
    name: 'Dam Wall Inspection',
    status: 'failed',
    startedAt: '2026-06-14T08:00:00Z',
  },
  {
    id: 'DFT-00',
    name: 'Initial Survey',
    status: 'completed',
    startedAt: '2026-06-10T10:00:00Z',
  },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'm1',
    role: 'agent',
    agentName: 'Nova',
    content: "👋 Welcome to **Andino Studio**. I'm Nova, your design agent. I've already analyzed the project requirements.\n\nType a mission goal or select a mission to begin.",
    timestamp: '2026-06-21T14:22:00Z',
  },
];

export const mockSuggestions: AISuggestion[] = [
  {
    id: 's1',
    text: 'Try increasing arm angle to 42° for better stability in crosswinds.',
    category: 'stability',
    impact: 'high',
  },
  {
    id: 's2',
    text: 'Consider 10-inch props — they improve hover efficiency by 15% in this weight class.',
    category: 'efficiency',
    impact: 'high',
  },
  {
    id: 's3',
    text: 'Moving the payload mount 12mm forward improves CG balance by 8%.',
    category: 'balance',
    impact: 'medium',
  },
  {
    id: 's4',
    text: 'A 4S 2200mAh battery gives 8% more endurance with only 3% weight penalty.',
    category: 'endurance',
    impact: 'medium',
  },
  {
    id: 's5',
    text: 'Ducted fans reduce noise by 60% but add 22% drag — tradeoff for urban ops.',
    category: 'noise',
    impact: 'low',
  },
];

export const agentLogEntries = [
  { time: '14:23:01', level: 'success', text: 'Mission started — tunnel inspection protocol v2.1' },
  { time: '14:23:04', level: 'info', text: 'Optical flow initialized, 12 features tracked' },
  { time: '14:23:08', level: 'success', text: 'Takeoff successful — altitude hold at 2.0m' },
  { time: '14:23:15', level: 'info', text: 'Transitioning to autonomous navigation' },
  { time: '14:23:22', level: 'info', text: 'LiDAR scan active: tunnel width 1.82m ±0.03m' },
  { time: '14:23:30', level: 'info', text: 'Tunnel entrance detected at bearing 187°, 12m ahead' },
  { time: '14:23:38', level: 'success', text: 'Entering tunnel — switching to INS+optical flow' },
  { time: '14:23:52', level: 'warn', text: 'Crosswind detected at ventilation shaft #3: 6.2 m/s' },
  { time: '14:24:01', level: 'info', text: 'Compensating with differential thrust — RPM delta: +340' },
  { time: '14:24:10', level: 'success', text: 'Section A structural survey started' },
  { time: '14:24:18', level: 'info', text: 'Crack detected at coord (12.4, 8.1, 2.3) — logging' },
  { time: '14:24:28', level: 'info', text: 'Thermal anomaly: +3.2°C at ventilation shaft #2' },
];
