import React from 'react';
import { Icon } from '../components/Icon';

export const SettingsScreen: React.FC = () => {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-gray-50 h-full p-6 md:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Configuración</h2>
        
        <div className="flex flex-col gap-6">
          {/* Section: Profile */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Perfil de Fundo</h3>
              <p className="text-sm text-gray-500">Información general de la unidad productiva.</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Nombre del Fundo</label>
                <input type="text" defaultValue="Fundo San José" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Código SENASA</label>
                <input type="text" defaultValue="SEN-2024-8829" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed" disabled />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Dirección Fiscal</label>
                <input type="text" defaultValue="Carr. Panamericana Norte Km 1040, Piura" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors">Guardar Cambios</button>
            </div>
          </section>

          {/* Section: Connectivity */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Sincronización y Offline</h3>
                <p className="text-sm text-gray-500">Gestión de datos en campo sin conexión.</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                <Icon name="cloud_done" className="text-sm" />
                Sistema Sincronizado
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-primary">
                    <Icon name="wifi" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Modo Offline Automático</p>
                    <p className="text-xs text-gray-500">Detectar pérdida de señal y guardar localmente</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                 <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                    <Icon name="sync" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Frecuencia de Sincronización</p>
                    <p className="text-xs text-gray-500">Cada 15 minutos en segundo plano</p>
                  </div>
                </div>
                <select className="text-sm border-gray-300 rounded-md bg-white py-1 pl-2 pr-8 focus:ring-primary focus:border-primary">
                  <option>15 min</option>
                  <option>30 min</option>
                  <option>1 hora</option>
                  <option>Manual</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section: Notifications */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Notificaciones</h3>
              <p className="text-sm text-gray-500">Alertas de incidencias y cambios de estado.</p>
            </div>
            <div className="divide-y divide-gray-100">
              {['Alertas de Plagas', 'Cambios de Temperatura Críticos', 'Documentos Aprobados por SENASA'].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-medium text-gray-700">{item}</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};