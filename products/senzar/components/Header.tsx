import React from 'react';
import { Icon } from './Icon';

export const Header: React.FC = () => {
  return (
    <header className="flex-none bg-white border-b border-gray-200 z-30">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center size-10 rounded-lg bg-primary/20 text-accent">
            <Icon name="eco" className="text-[28px]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-accent leading-none">AgroTrace</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Fundo San José - Campaña 2024</p>
          </div>
        </div>
        
        {/* Synchronization Semaphore */}
        <div className="hidden md:flex items-center gap-6 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-bold text-accent uppercase tracking-wide">Sincronizado</span>
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <span className="text-xs text-gray-500 font-medium">Última act: Hace 2 min</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            <Icon name="notifications" />
            <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-gray-900">Carlos M.</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
            <div className="size-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm">
              CM
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};