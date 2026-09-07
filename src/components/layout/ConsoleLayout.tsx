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
import HelpChatWidget from '../help/HelpChatWidget';

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
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'organizations', label: 'Orgs', icon: Building2 },
    { id: 'venues', label: 'Venues', icon: MapPin },
    { id: 'devices', label: 'Devices', icon: MonitorSmartphone },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reports', label: 'Reports', icon: Activity },
  ];

  const userTabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'devices', label: 'Devices', icon: MonitorSmartphone },
    { id: 'reports', label: 'Reports', icon: Activity },
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
    <div className="h-screen bg-slate-50 font-sans text-slate-900 flex flex-col xl:flex-row overflow-hidden relative">
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full pb-[calc(5.25rem+env(safe-area-inset-bottom))] xl:pb-0">
        
        {/* Mobile Header */}
        {role !== 'admin' && (
          <header className="xl:hidden h-14 bg-transparent flex items-center justify-between px-4 shrink-0 z-40 relative">
            <img
              src="/logo.png"
              alt="Ackit"
              className="h-8 w-auto object-contain"
            />
            
            <div className="flex items-center gap-2 bg-blue-600 text-white rounded-full px-2.5 py-2.5 shadow-md hover:bg-blue-700 transition-colors">
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

      {/* Mobile bottom nav — floating light pill + active hump (screenshot style) */}
      {role !== 'admin' && (
        <nav
          className="xl:hidden fixed bottom-0 left-0 right-0 z-50 px-3 sm:px-4 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-1 pointer-events-none"
          aria-label="Primary"
        >
          <div className="pointer-events-auto relative mx-auto w-full max-w-[26rem] ">
            <div className="relative w-full rounded-[2.5rem] bg-blue-100/35 px-2 shadow shadow-bottom-xl overflow-hidden">
              <ul className="relative flex items-stretch m-0 p-0 list-none">
                {/* Sliding active hump */}
                {activeTabIndex >= 0 && (
                  <motion.li
                    aria-hidden
                    className="absolute inset-y-0 z-0 pointer-events-none list-none"
                    initial={false}
                    animate={{ left: `${(activeTabIndex / tabCount) * 100}%` }}
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 34,
                      mass: 0.85,
                    }}
                    style={{ width: `${100 / tabCount}%` }}
                  >
                    {/* Single path: dome + both concave base fillets, so there are
                        no overlapping edges that could show seam lines. */}
                    <svg
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 text-blue-600"
                      style={{
                        width: 'min(calc(100% + 2.5rem), 6.75rem)',
                        height: 'calc(100% - 0.5rem)',
                      }}
                      viewBox="0 0 108 62"
                      preserveAspectRatio="none"
                      fill="currentColor"
                      focusable="false"
                    >
                      <path d="M0,62 A20,20 0 0 0 20,42 L20,34 A34,34 0 0 1 88,34 L88,42 A20,20 0 0 0 108,62 Z" />
                    </svg>
                  </motion.li>
                )}

                {mobileTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = isTabActive(tab.id);

                  return (
                    <li key={tab.id} className="relative z-10 flex-1 min-w-0 m-0 p-0 list-none">
                      <button
                        type="button"
                        onClick={() => handleTabClick(tab.id)}
                        aria-label={tab.label}
                        aria-current={active ? 'page' : undefined}
                        className={`
                          relative z-[1] w-full h-[4.35rem] flex flex-col items-center justify-center gap-0.5
                          outline-none transition-colors duration-300 active:scale-95
                          ${active ? 'text-white' : 'text-[#2f3542] hover:text-blue-600'}
                        `}
                      >
                        <Icon
                          className="w-[1.35rem] h-[1.35rem] shrink-0"
                          strokeWidth={active ? 2.5 : 2}
                        />
                        <span
                          className={`text-[10px] leading-tight tracking-wide ${
                            active ? 'font-bold' : 'font-medium'
                          }`}
                        >
                          {tab.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </nav>
      )}

      <HelpChatWidget />
    </div>
  );
}
