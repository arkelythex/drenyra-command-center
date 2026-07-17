import React from 'react';
import { Icon } from './Icon';
import { Screen } from '../types';

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onNavigate }) => {
  const linkClass = (screen: Screen) => `
    flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-colors cursor-pointer select-none
    ${currentScreen === screen 
      ? 'bg-primary/10 text-primary' 
      : 'text-gray-600 hover:bg-gray-100'}
  `;

  return (
    <aside className="w-20 lg:w-64 flex-none bg-white border-r border-gray-200 flex flex-col justify-between py-6 hidden md:flex h-full">
      <nav className="flex flex-col gap-2 px-3">
        <div className={linkClass('dashboard')} onClick={() => onNavigate('dashboard')}>
          <Icon name="dashboard" className={currentScreen === 'dashboard' ? 'filled' : ''} />
          <span className="hidden lg:block">Dashboard</span>
        </div>
        <div className={linkClass('audit')} onClick={() => onNavigate('audit')}>
          <Icon name="content_paste_search" className={currentScreen === 'audit' ? 'filled' : ''} />
          <span className="hidden lg:block">Auditoría</span>
        </div>
        <div 
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium cursor-pointer select-none"
          onClick={() => onNavigate('smart-entry')}
        >
          <Icon name="qr_code_scanner" />
          <span className="hidden lg:block">Smart Entry</span>
        </div>
        <div className={linkClass('logistics')} onClick={() => onNavigate('logistics')}>
          <Icon name="local_shipping" className={currentScreen === 'logistics' ? 'filled' : ''} />
          <span className="hidden lg:block">Logística</span>
        </div>
        <div className={linkClass('reports')} onClick={() => onNavigate('reports')}>
          <Icon name="assignment" className={currentScreen === 'reports' ? 'filled' : ''} />
          <span className="hidden lg:block">Reportes SENASA</span>
        </div>
      </nav>
      <div className="px-3">
        <div className={linkClass('settings')} onClick={() => onNavigate('settings')}>
          <Icon name="settings" className={currentScreen === 'settings' ? 'filled' : ''} />
          <span className="hidden lg:block">Configuración</span>
        </div>
      </div>
    </aside>
  );
};