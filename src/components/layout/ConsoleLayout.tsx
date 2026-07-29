import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { OrgOverlayPage } from '../overlays/OrgOverlayPage';
import { AddOrgOverlayPage } from '../overlays/AddOrgOverlayPage';
import { AddVenueOverlayPage } from '../overlays/AddVenueOverlayPage';
import { AddDeviceOverlayPage } from '../overlays/AddDeviceOverlayPage';
import { AddUserOverlayPage } from '../overlays/AddUserOverlayPage';
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
  LayoutDashboard
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../../context/AppContext';

export function ConsoleLayout() {
  const { 
    role, 
    logout,
    authLoading,
    hasActiveSubscription,
    activeTab, 
    setActiveTab, 
    isSidebarOpen, 
    setIsSidebarOpen, 
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

  if (authLoading) {
    return null;
  }

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'manager' && !hasActiveSubscription) {
    return <Navigate to="/subscribe" replace />;
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
    void logout().then(() => navigate('/login'));
  };

  const isTabActive = (tabId: string) => {
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
        
        {/* Mobile Header */}
        {role !== 'admin' && (
          <header className="lg:hidden h-12 bg-white border-b border-slate-100 flex items-center justify-between px-4 shrink-0 z-40 shadow-sm relative">
            <img
              src="/logo.png"
              alt="Ackit"
              className="h-8 w-auto object-contain"
            />
            
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
                              handleTabClick('dashboard');
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-600 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                              activeTab === 'dashboard' ? 'bg-blue-50/50 text-blue-600' : ''
                            }`}
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
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
