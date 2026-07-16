import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Building2, MapPin, MonitorSmartphone, CreditCard, Cpu, ChevronDown,
  Activity, Menu, Bell, LogOut, ChevronRight, Sliders, Zap,
} from 'lucide-react';
import {
  AdminWorkspaceProvider,
  AdminWorkspaceProps,
  useAdminWorkspace,
} from './context/AdminWorkspaceContext';
import { AddPlanDrawer } from './components/AddPlanDrawer';
import { AddManagerDrawer } from './components/AddManagerDrawer';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const {
    managers,
    currentTab,
    setCurrentTab,
    managementDropdownOpen,
    setManagementDropdownOpen,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    selectedManagerId,
    setSelectedManagerId,
    onLogout,
  } = useAdminWorkspace();

  // Sidebar Menu Config
  const sidebarItems = [
    { id: 'managers', label: 'Managers', icon: Users },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'venues', label: 'Venues', icon: MapPin },
    { id: 'devices', label: 'Devices', icon: MonitorSmartphone },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-700">
      {/* Header / Brand */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 tracking-wider">IOTIFY</h4>
          <span className="text-[9px] font-bold text-slate-400 block tracking-widest uppercase">ADMIN CONSOLE</span>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="flex-1 py-6 px-4 space-y-7 overflow-y-auto">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3">
            Platform
          </span>
          
          {/* Management Dropdown Section */}
          <div className="space-y-1">
            <button
              onClick={() => setManagementDropdownOpen(!managementDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-slate-400" />
                <span>Management</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${managementDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Indented Dropdown Items */}
            <AnimatePresence initial={false}>
              {managementDropdownOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="pl-3 space-y-1 overflow-hidden"
                >
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentTab(item.id as any);
                          setMobileSidebarOpen(false);
                          setSelectedManagerId(null);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Standalone items */}
          <div className="space-y-1 pt-1">
            {/* OTA Management */}
            <button
              onClick={() => {
                setCurrentTab('ota-management');
                setMobileSidebarOpen(false);
                setSelectedManagerId(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold rounded-xl transition-all ${
                currentTab === 'ota-management'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Zap className={`w-4 h-4 ${currentTab === 'ota-management' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>OTA Management</span>
            </button>

            {/* Brand Management */}
            <button
              onClick={() => {
                setCurrentTab('ac-brands');
                setMobileSidebarOpen(false);
                setSelectedManagerId(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold rounded-xl transition-all ${
                currentTab === 'ac-brands'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Cpu className={`w-4 h-4 ${currentTab === 'ac-brands' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Brand Management</span>
            </button>

            {/* Plan Management */}
            <button
              onClick={() => {
                setCurrentTab('plans');
                setMobileSidebarOpen(false);
                setSelectedManagerId(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold rounded-xl transition-all ${
                currentTab === 'plans'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <CreditCard className={`w-4 h-4 ${currentTab === 'plans' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Plan Management</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
            SA
          </div>
          <div className="min-w-0">
            <h5 className="text-xs font-bold text-slate-800 truncate">Super Admin</h5>
            <span className="text-[10px] font-medium text-slate-400 block truncate">admin@iotify.io</span>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full flex bg-slate-50/50 overflow-hidden text-slate-800">
      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden md:block w-64 border-r border-slate-100 bg-white shrink-0 h-full">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar (Slide-in Drawer) */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-white z-50 md:hidden h-full shadow-xl"
            >
              {renderSidebarContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Right Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header / Nav */}
        <header className="h-16 border-b border-slate-100 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            {currentTab === 'managers' && selectedManagerId ? (
              <div className="flex items-center gap-1.5 text-slate-400 text-sm font-semibold">
                <button
                  onClick={() => setSelectedManagerId(null)}
                  className="hover:text-slate-600 transition-colors"
                >
                  Managers
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-800 font-bold">
                  {managers.find((m) => m.id === selectedManagerId)?.name}
                </span>
              </div>
            ) : (
              <h2 className="text-base font-black text-slate-800 capitalize tracking-tight font-sans">
                {currentTab === 'ac-brands' 
                  ? 'AC Brand Management' 
                  : currentTab === 'ota-management'
                  ? 'OTA Management'
                  : currentTab === 'plans'
                  ? 'Plan Management'
                  : currentTab}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            </button>
            <div className="w-px h-5 bg-slate-100 mx-1" />
            <span className="text-xs font-bold text-slate-400">v1.2.0</span>
          </div>
        </header>

        {/* Dynamic Content — brand page scrolls inside its own cards */}
        <main
          className={`flex-1 min-h-0 flex flex-col ${
            currentTab === 'ac-brands'
              ? 'overflow-hidden p-0'
              : 'overflow-y-auto p-6'
          }`}
        >
          {children}
        </main>
      </div>

      {/* CREATE NEW PLAN SLIDING DRAWER - opens on right side */}
      <AddPlanDrawer />

      {/* ADD NEW MANAGER SLIDING DRAWER - consistent drawer experience */}
      <AddManagerDrawer />
    </div>
  );
}

/** Admin console shell — layout + workspace state + shared drawers */
export function AdminLayout({
  children,
  ...props
}: AdminWorkspaceProps & { children: React.ReactNode }) {
  return (
    <AdminWorkspaceProvider {...props}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminWorkspaceProvider>
  );
}
