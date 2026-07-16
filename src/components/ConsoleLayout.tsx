import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { OrgOverlayPage } from './OrgOverlayPage';
import { AddOrgOverlayPage } from './AddOrgOverlayPage';
import { AddVenueOverlayPage } from './AddVenueOverlayPage';
import { AddDeviceOverlayPage } from './AddDeviceOverlayPage';
import { AddUserOverlayPage } from './AddUserOverlayPage';
import { ACKitLogo } from './ACKitLogo';
import { 
  Menu, 
  User, 
  LogOut, 
  Building2, 
  MapPin, 
  MonitorSmartphone, 
  Users, 
  Activity, 
  ShieldAlert,
  BarChart3,
  Cpu,
  LayoutDashboard
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';

export function IotfiyLogo({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 select-none">
      <svg className={`${small ? 'w-6 h-6' : 'w-8 h-8'} shrink-0`} viewBox="0 0 130 110" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left C-Cloud contour */}
        <path 
          d="M38 85 C18 85 5 72 5 54 C5 36 18 23 38 23 C44 23 49 24.5 53 27" 
          stroke="#06b6d4" 
          strokeWidth="8" 
          strokeLinecap="round" 
          fill="none" 
        />
        {/* Top Main Cloud Arch */}
        <path 
          d="M30 25 C30 12 48 2 68 2 C88 2 102 16 102 34 C102 37 101.5 40 101 43" 
          stroke="#3b82f6" 
          strokeWidth="9" 
          strokeLinecap="round" 
          fill="none" 
        />
        {/* Integrated Green AC Power Cord Plug */}
        <rect x="35" y="55" width="24" height="15" rx="3" fill="#10b981" />
        <line x1="41" y1="70" x2="41" y2="82" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
        <line x1="53" y1="70" x2="53" y2="82" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
        <path d="M47 55 C47 48 55 48 55 55" stroke="#10b981" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
      <span className={`${small ? 'text-lg' : 'text-xl'} font-black tracking-tighter flex`}>
        <span className="text-sky-500">IoT</span>
        <span className="text-blue-900">FIY</span>
      </span>
    </div>
  );
}

export function ConsoleLayout() {
  const { 
    role, 
    setRole, 
    activeTab, 
    setActiveTab, 
    isSidebarOpen, 
    setIsSidebarOpen, 
    setSelectedUnitId 
  } = useAppContext();
  
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isOrgPageOpen, setIsOrgPageOpen] = useState(false);
  const [isAddOrgOpen, setIsAddOrgOpen] = useState(false);
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const resetAllAddOverlays = () => {
    setIsOrgPageOpen(false);
    setIsAddOrgOpen(false);
    setIsAddVenueOpen(false);
    setIsAddDeviceOpen(false);
    setIsAddUserOpen(false);
  };

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab, setActiveTab]);

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  const managerTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'organizations', label: 'Organization', icon: Building2 },
    { id: 'venues', label: 'Venues', icon: MapPin },
    { id: 'devices', label: 'Devices', icon: MonitorSmartphone },
    { id: 'users', label: 'Users', icon: Users }
  ];

  const userTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'devices', label: 'Devices', icon: MonitorSmartphone },
    { id: 'reports', label: 'Reports', icon: Activity }
  ];

  const mobileTabs = role === 'manager' ? managerTabs : userTabs;

  const handleTabClick = (tabId: string) => {
    resetAllAddOverlays();
    setActiveTab(tabId);
    navigate(`/${role}/${tabId}`);
  };

  const handleLogout = () => {
    setRole(null);
    setSelectedUnitId(null);
    navigate('/login');
  };

  const isTabActive = (tabId: string) => {
    if (tabId === 'dashboard') {
      return activeTab === 'dashboard' || activeTab === 'overview';
    }
    return activeTab === tabId;
  };

  const activeTabIndex = mobileTabs.findIndex((t) => isTabActive(t.id));
  const tabCount = mobileTabs.length;

  return (
    <div className="h-screen bg-slate-50 font-sans text-slate-900 flex flex-col lg:flex-row overflow-hidden relative">
      {/* Laptop Persistent Sidebar */}
      {role !== 'admin' && (
        <Sidebar 
          role={role} 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            resetAllAddOverlays();
            setActiveTab(tab);
            navigate(`/${role}/${tab}`);
          }} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout} 
        />
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full pb-[calc(3.25rem+0.75rem)] lg:pb-0">
        
        {/* Mobile Header (Figma styled: Left IoTFIY Logo, Right Blue Hamburger Menu/Profile capsule pill) */}
        {role !== 'admin' && (
          <header className="lg:hidden h-12 bg-white border-b border-slate-100 flex items-center justify-between px-4 shrink-0 z-40 shadow-sm relative">
            <IotfiyLogo small />
            
            <div className="flex items-center gap-2 bg-blue-600 text-white rounded-full px-2.5 py-1 shadow-md hover:bg-blue-700 transition-colors">
              <Menu 
                className={`w-4 h-4 cursor-pointer active:scale-95 transition-all ${
                  (activeTab === 'organizations' && isAddOrgOpen) || 
                  (activeTab === 'venues' && isAddVenueOpen) || 
                  (activeTab === 'devices' && isAddDeviceOpen) || 
                  (activeTab === 'users' && isAddUserOpen) || 
                  (activeTab !== 'organizations' && activeTab !== 'venues' && activeTab !== 'devices' && activeTab !== 'users' && isOrgPageOpen)
                    ? 'rotate-90 text-blue-200' 
                    : ''
                }`} 
                onClick={() => {
                  if (activeTab === 'organizations') {
                    setIsAddOrgOpen(!isAddOrgOpen);
                  } else if (activeTab === 'venues') {
                    setIsAddVenueOpen(!isAddVenueOpen);
                  } else if (activeTab === 'devices') {
                    setIsAddDeviceOpen(!isAddDeviceOpen);
                  } else if (activeTab === 'users') {
                    setIsAddUserOpen(!isAddUserOpen);
                  } else {
                    setIsOrgPageOpen(!isOrgPageOpen);
                  }
                }} 
              />
              <div className="w-px h-3.5 bg-white/20" />
              <div className="relative">
                <User 
                  className="w-4 h-4 cursor-pointer active:scale-95 transition-transform" 
                  onClick={() => setShowProfileMenu(!showProfileMenu)} 
                />
                
                {/* Profile Floating Dropdown Menu */}
                {showProfileMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                      {role === 'manager' && (
                        <>
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              handleTabClick('overview');
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-600 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                              activeTab === 'overview' ? 'bg-blue-50/50 text-blue-600' : ''
                            }`}
                          >
                            <BarChart3 className="w-4 h-4" />
                            Overview
                          </button>

                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              handleTabClick('reports');
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-600 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                              activeTab === 'reports' ? 'bg-blue-50/50 text-blue-600' : ''
                            }`}
                          >
                            <Activity className="w-4 h-4" />
                            Energy Report
                          </button>

                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              handleTabClick('ac-brands');
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-600 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                              activeTab === 'ac-brands' ? 'bg-blue-50/50 text-blue-600' : ''
                            }`}
                          >
                            <Cpu className="w-4 h-4" />
                            Brand Management
                          </button>
                          
                          <div className="border-t border-slate-100 my-1" />
                        </>
                      )}

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Content Outlet Frame (Flexible, viewport constrained) */}
        <main className={`flex-1 min-h-0 h-full overflow-hidden flex flex-col`}>
          <div className="flex-1 min-h-0 h-full p-0 overflow-hidden flex flex-col">
            {activeTab === 'organizations' && isAddOrgOpen ? (
              <AddOrgOverlayPage onClose={() => setIsAddOrgOpen(false)} />
            ) : activeTab === 'venues' && isAddVenueOpen ? (
              <AddVenueOverlayPage onClose={() => setIsAddVenueOpen(false)} />
            ) : activeTab === 'devices' && isAddDeviceOpen ? (
              <AddDeviceOverlayPage onClose={() => setIsAddDeviceOpen(false)} />
            ) : activeTab === 'users' && isAddUserOpen ? (
              <AddUserOverlayPage onClose={() => setIsAddUserOpen(false)} />
            ) : isOrgPageOpen ? (
              <OrgOverlayPage onClose={() => setIsOrgPageOpen(false)} />
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav — blue bar with sliding white active scoop */}
      {role !== 'admin' && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-3 pt-1 bg-gradient-to-t from-slate-100/90 via-slate-50/40 to-transparent">
          <div className="relative w-full bg-blue-600 rounded-[1.85rem] shadow-xl shadow-blue-600/25 flex items-center min-h-[3.4rem] overflow-hidden">
            {/* Sliding white U-scoop indicator */}
            {activeTabIndex >= 0 && (
              <motion.div
                className="absolute inset-y-0 z-0 flex justify-center pointer-events-none"
                initial={false}
                animate={{ left: `${(activeTabIndex / tabCount) * 100}%` }}
                transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.85 }}
                style={{ width: `${100 / tabCount}%` }}
              >
                <div className="relative self-start w-[70%] max-w-[3rem] h-[2.65rem]">
                  {/* White scoop cut into the blue bar */}
                  <div className="absolute inset-0 bg-[#f8fafc] rounded-b-[1.55rem]" />
                  {/* Left concave fillet — hide on first tab so it doesn't poke past the bar edge */}
                  {activeTabIndex > 0 && (
                    <svg
                      className="absolute top-[1.35rem] right-full w-3.5 h-3.5 text-blue-600 fill-current"
                      viewBox="0 0 16 16"
                      aria-hidden
                    >
                      <path d="M16 0 A 16 16 0 0 0 0 16 H 16 V 0 Z" />
                    </svg>
                  )}
                  {/* Right concave fillet — hide on last tab so it doesn't poke past the bar edge */}
                  {activeTabIndex < tabCount - 1 && (
                    <svg
                      className="absolute top-[1.35rem] left-full w-3.5 h-3.5 text-blue-600 fill-current"
                      viewBox="0 0 16 16"
                      aria-hidden
                    >
                      <path d="M0 0 A 16 16 0 0 1 16 16 H 0 V 0 Z" />
                    </svg>
                  )}
                </div>
              </motion.div>
            )}

            {mobileTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isTabActive(tab.id);

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  aria-label={tab.label}
                  aria-current={active ? 'page' : undefined}
                  className={`
                    relative z-10 flex-1 min-w-0 flex items-center justify-center self-stretch
                    outline-none transition-colors duration-300 active:scale-95
                    ${active ? 'text-blue-600' : 'text-white'}
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
