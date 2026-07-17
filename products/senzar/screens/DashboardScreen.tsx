import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Lot } from '../types';

const MOCK_LOTS: Lot[] = [
  { id: 'A-01', name: 'Lote A-01', crop: 'Mango Kent', status: 'cosechado', progress: 100 },
  { id: 'A-02', name: 'Lote A-02', crop: 'Uva Red Globe', status: 'en-proceso', progress: 85, details: { responsible: 'Ing. R. Torres', startTime: '06:30 AM' } },
  { id: 'A-03', name: 'Lote A-03', crop: 'Mango Kent', status: 'espera', progress: 0 },
  { id: 'B-01', name: 'Lote B-01', crop: 'Uva Red Globe', status: 'espera', progress: 0 },
  { id: 'B-02', name: 'Lote B-02', crop: 'Mango Edward', status: 'alerta', alertType: 'riego', progress: 45 },
  { id: 'B-03', name: 'Lote B-03', crop: 'Mango Kent', status: 'espera', progress: 0 },
  { id: 'C-01', name: 'Lote C-01', crop: 'Uva Red Globe', status: 'espera', progress: 0 },
  { id: 'C-02', name: 'Lote C-02', crop: 'Mango Kent', status: 'espera', progress: 0 },
  { id: 'C-03', name: 'Lote C-03', crop: 'Mango Kent', status: 'espera', progress: 0 },
];

export const DashboardScreen: React.FC = () => {
  const [selectedLotId, setSelectedLotId] = useState<string>('A-02');

  const selectedLot = MOCK_LOTS.find(l => l.id === selectedLotId) || MOCK_LOTS[0];

  return (
    <div className="flex flex-1 flex-col lg:flex-row overflow-hidden bg-gray-50 h-full">
      {/* Left Panel: Heatmap & Stats */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Cosecha del Día</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">12,450 kg</h3>
              <span className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
                <Icon name="trending_up" className="text-sm" /> +8% vs ayer
              </span>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-accent">
              <Icon name="scale" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Lotes Activos</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">8 / 12</h3>
              <span className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-1">
                4 en descanso
              </span>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Icon name="grid_on" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Incidencias</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">2</h3>
              <span className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                <Icon name="warning" className="text-sm" /> Requieren atención
              </span>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <Icon name="report_problem" />
            </div>
          </div>
        </div>

        {/* Heatmap Section */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[500px]">
          <div className="p-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">Mapa de Calor - Lotes</h2>
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button className="px-3 py-1 text-xs font-bold rounded-md bg-white text-gray-900 shadow-sm transition-all">Estado</button>
                <button className="px-3 py-1 text-xs font-medium rounded-md text-gray-500 hover:text-gray-700 transition-all">Rendimiento</button>
              </div>
            </div>
            <div className="flex gap-2">
              <select className="bg-gray-50 border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary py-1.5 pl-3 pr-8">
                <option>Todo el Fundo</option>
                <option>Sector Norte</option>
                <option>Sector Sur</option>
              </select>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                <Icon name="filter_list" className="text-lg" />
              </button>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                <Icon name="fullscreen" className="text-lg" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 relative bg-gray-100 p-6 overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(#6f9b69 1px, transparent 1px)", backgroundSize: "20px 20px"}}></div>
            
            <div className="relative w-full h-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 grid-rows-3 gap-4 max-w-5xl mx-auto">
              {MOCK_LOTS.map((lot) => {
                const isSelected = lot.id === selectedLotId;
                const statusColors = {
                  cosechado: 'border-green-500',
                  'en-proceso': 'border-accent',
                  espera: 'border-gray-200 hover:border-primary',
                  alerta: 'border-red-500'
                };
                const tagColors = {
                  cosechado: 'bg-green-500',
                  'en-proceso': 'bg-yellow-500',
                  espera: 'bg-gray-400',
                  alerta: 'bg-red-500'
                };

                return (
                  <div 
                    key={lot.id}
                    onClick={() => setSelectedLotId(lot.id)}
                    className={`group relative bg-white rounded-lg border-2 shadow-sm cursor-pointer flex flex-col justify-between p-3 transition-all
                      ${statusColors[lot.status]}
                      ${isSelected ? 'ring-4 ring-accent/20 scale-105 z-10 shadow-xl' : 'opacity-90 hover:opacity-100 hover:shadow-md'}
                    `}
                  >
                    <div className={`absolute top-0 right-0 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase ${tagColors[lot.status]}`}>
                      {lot.status.replace('-', ' ')}
                    </div>
                    
                    <div className="mt-2">
                      <h4 className={`font-bold ${isSelected ? 'text-accent' : 'text-gray-900'}`}>{lot.name}</h4>
                      <p className="text-xs text-gray-500">{lot.crop}</p>
                    </div>

                    {lot.status === 'alerta' ? (
                      <div className="flex items-center gap-1 text-xs text-red-600 font-bold mt-2">
                        <Icon name="water_drop" className="text-sm" filled /> {lot.alertType === 'riego' ? 'Riego' : 'Plaga'}
                      </div>
                    ) : lot.status === 'en-proceso' ? (
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-xs font-bold text-gray-700">{lot.progress}%</span>
                        <Icon name="agriculture" className="text-accent animate-pulse text-lg" />
                      </div>
                    ) : (
                      <div className="h-4"></div>
                    )}

                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${lot.status === 'en-proceso' ? 'bg-yellow-500' : lot.status === 'cosechado' ? 'bg-green-500' : lot.status === 'alerta' ? 'bg-red-500' : 'bg-gray-400'}`} 
                        style={{width: `${lot.progress}%`}}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur border border-gray-200 p-2 rounded-lg flex flex-col gap-2 shadow-lg text-xs">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> <span>Cosechado / Listo</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> <span>En Proceso</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> <span>Incidencia</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-400"></div> <span>En Espera</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Traceability Widget */}
      <div className="w-full lg:w-96 flex-none bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
        <div className="p-6 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-1 text-xs font-bold text-accent ring-1 ring-inset ring-accent/20">LOTE SELECCIONADO</span>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <Icon name="close" />
            </button>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">{selectedLot.name}</h2>
          <p className="text-sm text-gray-600 font-medium">{selectedLot.crop} • Sector Norte</p>
          
          {selectedLot.details && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="text-[10px] uppercase text-gray-400 font-bold block">Responsable</span>
                <span className="text-sm font-bold text-gray-800">{selectedLot.details.responsible}</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="text-[10px] uppercase text-gray-400 font-bold block">Inicio Cosecha</span>
                <span className="text-sm font-bold text-gray-800">{selectedLot.details.startTime}</span>
              </div>
            </div>
          )}
        </div>

        {/* Stepper Content */}
        <div className="flex-1 p-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Cadena de Custodia</h3>
          <div className="relative pl-4">
            <div className="absolute left-6 top-2 bottom-6 w-0.5 bg-gray-200"></div>
            
            {/* Step 1: Cosecha (Completed) */}
            <div className="relative flex gap-4 pb-8 group">
              <div className="relative z-10 flex-none size-5 mt-1 bg-accent rounded-full border-2 border-white ring-2 ring-accent flex items-center justify-center">
                <Icon name="check" className="text-white text-[12px] font-bold" />
              </div>
              <div className="flex-1 -mt-1 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex justify-between items-start">
                  <h4 className="text-base font-bold text-accent">Cosecha en Campo</h4>
                  <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded text-green-700 shadow-sm">100%</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">450 jabas registradas</p>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Icon name="schedule" className="text-[14px]" /> Finalizado: 09:15 AM
                </div>
              </div>
            </div>

            {/* Step 2: Transporte (Active) */}
            <div className="relative flex gap-4 pb-8">
              <div className="relative z-10 flex-none size-5 mt-1 bg-white rounded-full border-2 border-yellow-500 ring-2 ring-yellow-500/30 flex items-center justify-center animate-pulse">
                <div className="size-2 bg-yellow-500 rounded-full"></div>
              </div>
              <div className="flex-1 -mt-1 p-3 bg-white rounded-lg border-l-4 border-yellow-500 shadow-md">
                <div className="flex justify-between items-start">
                  <h4 className="text-base font-bold text-gray-900">Transporte a Planta</h4>
                  <span className="text-[10px] font-bold bg-yellow-100 px-1.5 py-0.5 rounded text-yellow-800">EN RUTA</span>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Icon name="local_shipping" className="text-[16px] text-gray-400" />
                    <span>Camión: <b>Volvo FH-12</b></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Icon name="badge" className="text-[16px] text-gray-400" />
                    <span>Placa: <b>V1T-882</b></span>
                  </div>
                </div>
                <button className="mt-3 w-full py-1.5 text-xs font-bold text-center border border-gray-200 rounded bg-gray-50 hover:bg-gray-100 transition-colors">
                  Ver GPS en tiempo real
                </button>
              </div>
            </div>

            {/* Step 3: Recepción (Pending) */}
            <div className="relative flex gap-4 pb-8 opacity-50">
              <div className="relative z-10 flex-none size-5 mt-1 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
              <div className="flex-1 -mt-1">
                <h4 className="text-base font-bold text-gray-500">Recepción en Planta</h4>
                <p className="text-xs text-gray-400 mt-1">Pendiente de llegada</p>
              </div>
            </div>

            {/* Step 4: Calidad (Pending) */}
            <div className="relative flex gap-4 opacity-50">
              <div className="relative z-10 flex-none size-5 mt-1 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
              <div className="flex-1 -mt-1">
                <h4 className="text-base font-bold text-gray-500">Control de Calidad</h4>
                <p className="text-xs text-gray-400 mt-1">Esperando lote</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 mt-auto">
          <button className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold py-3.5 px-4 rounded-lg shadow-lg shadow-accent/20 transition-all transform hover:scale-[1.01]">
            <Icon name="assignment_turned_in" />
            GENERAR REPORTE SENASA
          </button>
          <button className="w-full mt-3 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-bold py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors">
            <Icon name="edit" />
            Editar Detalles del Lote
          </button>
        </div>
      </div>
    </div>
  );
};