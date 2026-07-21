import React from 'react';
import { Users, CreditCard, LayoutDashboard, Activity, Building2, LogOut, Settings, BarChart3, MapPin, MonitorSmartphone, X, Cpu } from 'lucide-react';
import { Role } from '../../types';
import { ACKitLogo } from '../ui/ACKitLogo';

interface SidebarProps {
  role: Role;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ role, activeTab, onTabChange, onLogout, isOpen, onClose }: SidebarProps) {
  const adminTabs = [
    { id: 'managers', label: 'Managers', icon: Users },
    { id: 'plans', label: 'Plans', icon: CreditCard },
    { id: 'ac-brands', label: 'AC Brand Management', icon: Cpu },
  ];

  const managerTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', label: 'Reports', icon: Activity },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'venues', label: 'Venues', icon: MapPin },
    { id: 'devices', label: 'Devices', icon: MonitorSmartphone },
  ];

  const userTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', label: 'Reports', icon: Activity },
    { id: 'devices', label: 'Devices', icon: MonitorSmartphone },
  ];

  const tabs = role === 'admin' ? adminTabs : role === 'manager' ? managerTabs : userTabs;

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div 
        className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col h-full fixed lg:relative z-50 w-20 overflow-y-auto [@media(min-height:750px)]:overflow-y-visible ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 flex items-center justify-center border-b border-slate-200 h-16 shrink-0 relative">
          <div className="flex items-center justify-center">
            <ACKitLogo variant="icon" size="sm" />
          </div>
          {isOpen && (
            <button 
              onClick={onClose}
              className="lg:hidden absolute -right-10 top-4 text-white p-2 bg-slate-800 rounded-full shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 py-3 [@media(min-height:750px)]:py-6 flex flex-col gap-2 [@media(min-height:750px)]:gap-4 px-3 overflow-visible">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  if (onClose) onClose();
                }}
                className={`group relative flex items-center justify-center w-10 h-10 [@media(min-height:750px)]:w-12 [@media(min-height:750px)]:h-12 mx-auto rounded-xl transition-colors shrink-0 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 [@media(min-height:750px)]:w-6 [@media(min-height:750px)]:h-6 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
                  {tab.label}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-3 [@media(min-height:750px)]:p-4 border-t border-slate-200 flex justify-center overflow-visible shrink-0">
          <button
            onClick={onLogout}
            className="group relative flex items-center justify-center w-10 h-10 [@media(min-height:750px)]:w-12 [@media(min-height:750px)]:h-12 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
          >
            <LogOut className="w-5 h-5 [@media(min-height:750px)]:w-6 [@media(min-height:750px)]:h-6 shrink-0" />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-red-600 text-white text-xs font-semibold rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
              Logout
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-red-600" />
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
