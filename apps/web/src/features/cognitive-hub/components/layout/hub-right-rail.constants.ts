export interface IntegrationStatus {
  name: string;
  status: string;
  tone: 'ok' | 'warn';
}

export function buildIntegrationStatus(isSwarmStreaming: boolean): IntegrationStatus[] {
  return [
    { name: 'API Clave SOL', status: 'Conectada', tone: 'ok' },
    { name: 'API SUNAT', status: isSwarmStreaming ? 'Monitoreando' : 'Operativa', tone: 'ok' },
    { name: 'Fallback Agentic', status: 'Listo (HITL habilitable)', tone: 'warn' },
  ];
}
