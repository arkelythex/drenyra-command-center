import type { Telemetry, Mission, AgentMessage, LogEntry, DroneDesign, AgentEvent } from '@/types/drone';

export const mockTelemetry: Telemetry = {
  lat: -11.5,
  lon: -77.2,
  altitude: 4027,
  speed: 12.5,
  voltage: 22.4,
  current: 8.2,
  batteryPercent: 85,
  gpsSats: 14,
  flightMode: 'AUTO',
};

export const mockMissions: Mission[] = [
  { id: 'M-001', name: 'Survey Tajo Norte', status: 'completed', startedAt: '2026-06-15T08:00:00Z' },
  { id: 'M-002', name: 'Tunnel Inspection', status: 'completed', startedAt: '2026-06-16T09:30:00Z' },
  { id: 'M-003', name: 'Open Pit Mapping', status: 'in_flight', startedAt: '2026-06-20T14:00:00Z' },
  { id: 'M-004', name: 'Payload Delivery', status: 'failed', startedAt: '2026-06-18T11:15:00Z' },
  { id: 'M-005', name: 'Pipeline Patrol', status: 'completed', startedAt: '2026-06-19T07:45:00Z' },
  { id: 'M-006', name: 'Emergency Response', status: 'planning', startedAt: '2026-06-21T06:00:00Z' },
];

export const mockMessages: AgentMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    text: "Welcome to Andino Studio. I'm your AI co-pilot for drone design and mission evolution. How can I help you today?",
    timestamp: '2026-06-21T12:00:00Z',
  },
  {
    id: 'msg-2',
    role: 'user',
    text: 'I need a drone design for high-altitude mine surveying in the Andes. Operating at 4500m, carrying a LiDAR payload.',
    timestamp: '2026-06-21T12:01:00Z',
  },
  {
    id: 'msg-3',
    role: 'assistant',
    text: "Great challenge. At 4500m, air density is ~60% of sea level — you'll need larger props and higher kV motors to compensate. I recommend starting with a heavy-lift quad or X8 coaxial. Would you like me to generate an initial design?",
    timestamp: '2026-06-21T12:01:30Z',
  },
  {
    id: 'msg-4',
    role: 'user',
    text: 'Yes, generate the design. Optimize for flight time above 25 minutes with a 1.5kg payload.',
    timestamp: '2026-06-21T12:02:00Z',
  },
  {
    id: 'msg-5',
    role: 'assistant',
    text: "Design generated. I've configured a 350mm X8 coaxial with 14\" props, 6S 12000mAh, and MN501 motors. Estimated flight time: 28.4 min at 4500m. TWR: 2.1. Total cost: ~$2,450. Review the design tab for full specs.",
    timestamp: '2026-06-21T12:02:45Z',
  },
];

export const mockLogs: LogEntry[] = [
  { id: 'log-1', timestamp: '2026-06-20T14:00:00Z', level: 'INFO', message: 'System boot. Flight controller initialized.' },
  { id: 'log-2', timestamp: '2026-06-20T14:00:05Z', level: 'INFO', message: 'GPS lock acquired: 14 sats.' },
  { id: 'log-3', timestamp: '2026-06-20T14:00:10Z', level: 'INFO', message: 'Battery OK: 22.4V / 85%.' },
  { id: 'log-4', timestamp: '2026-06-20T14:00:15Z', level: 'INFO', message: 'Arming sequence started.' },
  { id: 'log-5', timestamp: '2026-06-20T14:00:16Z', level: 'WARN', message: 'Barometer reading unstable — cross-checking with GPS altitude.' },
  { id: 'log-6', timestamp: '2026-06-20T14:00:20Z', level: 'INFO', message: 'Motors armed. Throttle raised to hover.' },
  { id: 'log-7', timestamp: '2026-06-20T14:00:25Z', level: 'INFO', message: 'Takeoff complete. Altitude: 4030m.' },
  { id: 'log-8', timestamp: '2026-06-20T14:00:30Z', level: 'INFO', message: 'Switching to AUTO mode. Mission: Open Pit Mapping.' },
  { id: 'log-9', timestamp: '2026-06-20T14:01:00Z', level: 'INFO', message: 'Waypoint 1/24 reached. Starting survey grid.' },
  { id: 'log-10', timestamp: '2026-06-20T14:05:00Z', level: 'INFO', message: 'Wind gust detected: 18 km/h. Compensating.' },
  { id: 'log-11', timestamp: '2026-06-20T14:10:00Z', level: 'INFO', message: 'LiDAR scan active. 14.2M points collected.' },
  { id: 'log-12', timestamp: '2026-06-20T14:15:00Z', level: 'WARN', message: 'Thermal camera temp rising: 62°C. Reducing scan rate.' },
  { id: 'log-13', timestamp: '2026-06-20T14:20:00Z', level: 'INFO', message: 'Waypoint 18/24. Battery: 62%.' },
  { id: 'log-14', timestamp: '2026-06-20T14:25:00Z', level: 'INFO', message: 'Waypoint 24/24. Survey complete. Returning to launch.' },
  { id: 'log-15', timestamp: '2026-06-20T14:27:00Z', level: 'INFO', message: 'Approaching LZ. Descending to 4025m.' },
  { id: 'log-16', timestamp: '2026-06-20T14:27:30Z', level: 'INFO', message: 'Landing complete. Throttle disarmed.' },
  { id: 'log-17', timestamp: '2026-06-20T14:27:35Z', level: 'INFO', message: 'Mission summary: 27.4 min flight, 3.2 km covered, 18.7M LiDAR points.' },
  { id: 'log-18', timestamp: '2026-06-20T14:27:40Z', level: 'INFO', message: 'Log saved to /missions/M-003/report.json.' },
];

export const mockDesign: DroneDesign = {
  frameType: 'quad',
  armLength: 250,
  armAngle: 45,
  motorCount: 4,
  motorModel: 'MN4010',
  propellerDiameter: 13,
  propellerPitch: 4.5,
  batteryCells: 6,
  batteryCapacity: 10000,
  frameMaterial: 'carbon',
  payloadMass: 800,
  auw: 4200,
  totalThrust: 12600,
  twr: 3.0,
  flightTimeMin: 22.5,
  costUsd: 1850,
};

export const mockSuggestions: string[] = [
  'Upgrade to X8 coaxial for redundancy — doubles motor count with minimal frame weight increase.',
  'Switch to 14" props with MN501 motors for 15% more thrust at high altitude.',
  'Add a 200g RTK module for sub-2cm positional accuracy in canyon surveys.',
  'Reduce arm length to 220mm for a stiffer frame — improves vibration damping by 30%.',
  'Consider PETG frame for rapid prototyping — 40% cheaper than carbon and sufficient for sub-15min flights.',
];

export const mockAgentEvents: AgentEvent[] = [
  { id: 'evt-1', timestamp: '14:00:00', agent: 'NAV', message: 'Mission loaded: Open Pit Mapping (M-003)', severity: 'info' },
  { id: 'evt-2', timestamp: '14:00:05', agent: 'SYS', message: 'Flight controller ready. Sensors calibrated.', severity: 'info' },
  { id: 'evt-3', timestamp: '14:00:10', agent: 'NAV', message: 'Arming sequence initiated', severity: 'info' },
  { id: 'evt-4', timestamp: '14:00:12', agent: 'SYS', message: 'Barometer unstable — GPS cross-check active', severity: 'warning' },
  { id: 'evt-5', timestamp: '14:00:15', agent: 'NAV', message: 'Takeoff complete. Altitude: 4030m', severity: 'info' },
  { id: 'evt-6', timestamp: '14:00:20', agent: 'NAV', message: 'AUTO mode engaged. Heading to WP1.', severity: 'info' },
  { id: 'evt-7', timestamp: '14:05:00', agent: 'ENV', message: 'Wind gust: 18 km/h from NE. Compensating.', severity: 'warning' },
  { id: 'evt-8', timestamp: '14:10:00', agent: 'PLD', message: 'LiDAR active. 14.2M points collected.', severity: 'info' },
  { id: 'evt-9', timestamp: '14:15:00', agent: 'PLD', message: 'Thermal camera 62°C — reducing scan rate.', severity: 'warning' },
  { id: 'evt-10', timestamp: '14:20:00', agent: 'NAV', message: 'WP18/24. Battery: 62%. On schedule.', severity: 'info' },
  { id: 'evt-11', timestamp: '14:25:00', agent: 'NAV', message: 'Survey complete. RTB initiated.', severity: 'info' },
  { id: 'evt-12', timestamp: '14:27:00', agent: 'NAV', message: 'Approaching LZ. Descent to 4025m.', severity: 'info' },
];
