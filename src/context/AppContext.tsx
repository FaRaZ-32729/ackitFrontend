import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Role, 
  ACUnit, 
  ACEvent, 
  ManagerAccount, 
  UserAccount, 
  Organization, 
  Venue, 
  SubscriptionPlan 
} from '../types';
import { 
  mockACUnits, 
  mockManagers, 
  mockUsers, 
  mockOrgs, 
  mockVenues, 
  mockPlans 
} from '../data';

interface AppContextType {
  role: Role | null;
  setRole: (role: Role | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  units: ACUnit[];
  setUnits: React.Dispatch<React.SetStateAction<ACUnit[]>>;
  managers: ManagerAccount[];
  setManagers: React.Dispatch<React.SetStateAction<ManagerAccount[]>>;
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  orgs: Organization[];
  setOrgs: React.Dispatch<React.SetStateAction<Organization[]>>;
  venues: Venue[];
  setVenues: React.Dispatch<React.SetStateAction<Venue[]>>;
  plans: SubscriptionPlan[];
  setPlans: React.Dispatch<React.SetStateAction<SubscriptionPlan[]>>;
  selectedUnitId: string | null;
  setSelectedUnitId: (id: string | null) => void;
  selectedVenueId: string | null;
  setSelectedVenueId: (id: string | null) => void;
  
  // Handlers
  handleTogglePower: (id: string) => void;
  handleSetTemp: (id: string, temp: number) => void;
  handleToggleLock: (id: string) => void;
  handleToggleEventLock: (id: string) => void;
  handleAddEvent: (unitId: string, event: Omit<ACEvent, 'id'>) => void;
  handleDeleteEvent: (unitId: string, eventId: string) => void;
  handleToggleEvent: (unitId: string, eventId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => {
    const saved = localStorage.getItem('iotify_role');
    return saved ? (saved as Role) : null;
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [units, setUnits] = useState<ACUnit[]>(() => {
    const saved = localStorage.getItem('iotify_units');
    return saved ? JSON.parse(saved) : mockACUnits;
  });
  const [managers, setManagers] = useState<ManagerAccount[]>(() => {
    const saved = localStorage.getItem('iotify_managers');
    return saved ? JSON.parse(saved) : mockManagers;
  });
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('iotify_users');
    return saved ? JSON.parse(saved) : mockUsers;
  });
  const [orgs, setOrgs] = useState<Organization[]>(() => {
    const saved = localStorage.getItem('iotify_orgs');
    return saved ? JSON.parse(saved) : mockOrgs;
  });
  const [venues, setVenues] = useState<Venue[]>(() => {
    const saved = localStorage.getItem('iotify_venues');
    return saved ? JSON.parse(saved) : mockVenues;
  });
  const [plans, setPlans] = useState<SubscriptionPlan[]>(() => {
    const saved = localStorage.getItem('iotify_plans');
    return saved ? JSON.parse(saved) : mockPlans;
  });
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  // Synchronize to localStorage for persistence
  useEffect(() => {
    if (role) localStorage.setItem('iotify_role', role);
    else localStorage.removeItem('iotify_role');
  }, [role]);

  useEffect(() => {
    localStorage.setItem('iotify_units', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('iotify_managers', JSON.stringify(managers));
  }, [managers]);

  useEffect(() => {
    localStorage.setItem('iotify_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('iotify_orgs', JSON.stringify(orgs));
  }, [orgs]);

  useEffect(() => {
    localStorage.setItem('iotify_venues', JSON.stringify(venues));
  }, [venues]);

  useEffect(() => {
    localStorage.setItem('iotify_plans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    if (role === 'admin') setActiveTab('managers');
    else if (role === 'manager') {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
      setActiveTab(isMobile ? 'dashboard' : 'overview');
    }
    else if (role === 'user') setActiveTab('dashboard');
  }, [role]);

  // Simulate real-time temperature fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setUnits((prev) =>
        prev.map((unit) => {
          if (!unit.isOn) return unit;
          
          const diff = unit.targetTemp - unit.currentTemp;
          const fluctuation = (Math.random() - 0.5) * 0.5;
          
          let newTemp = unit.currentTemp;
          if (Math.abs(diff) > 0.5) {
            newTemp += diff > 0 ? 0.2 : -0.2;
          } else {
            newTemp += fluctuation;
          }

          return {
            ...unit,
            currentTemp: Math.round(newTemp * 10) / 10,
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleTogglePower = (id: string) => {
    setUnits((prev) =>
      prev.map((unit) =>
        unit.id === id ? { ...unit, isOn: !unit.isOn } : unit
      )
    );
  };

  const handleSetTemp = (id: string, temp: number) => {
    setUnits((prev) =>
      prev.map((unit) =>
        unit.id === id ? { ...unit, targetTemp: temp } : unit
      )
    );
  };

  const handleToggleLock = (id: string) => {
    setUnits((prev) =>
      prev.map((unit) =>
        unit.id === id ? { ...unit, isLocked: !unit.isLocked } : unit
      )
    );
  };

  const handleToggleEventLock = (id: string) => {
    setUnits((prev) =>
      prev.map((unit) =>
        unit.id === id ? { ...unit, eventLocked: !unit.eventLocked } : unit
      )
    );
  };

  const handleAddEvent = (unitId: string, event: Omit<ACEvent, 'id'>) => {
    setUnits((prev) =>
      prev.map((unit) => {
        if (unit.id === unitId) {
          const newEvent: ACEvent = {
            ...event,
            id: `evt-${Date.now()}`,
          };
          return { ...unit, events: [...unit.events, newEvent] };
        }
        return unit;
      })
    );
  };

  const handleDeleteEvent = (unitId: string, eventId: string) => {
    setUnits((prev) =>
      prev.map((unit) => {
        if (unit.id === unitId) {
          return {
            ...unit,
            events: unit.events.filter((e) => e.id !== eventId),
          };
        }
        return unit;
      })
    );
  };

  const handleToggleEvent = (unitId: string, eventId: string) => {
    setUnits((prev) =>
      prev.map((unit) => {
        if (unit.id === unitId) {
          return {
            ...unit,
            events: unit.events.map((e) =>
              e.id === eventId ? { ...e, enabled: !e.enabled } : e
            ),
          };
        }
        return unit;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeTab,
        setActiveTab,
        isSidebarOpen,
        setIsSidebarOpen,
        units,
        setUnits,
        managers,
        setManagers,
        users,
        setUsers,
        orgs,
        setOrgs,
        venues,
        setVenues,
        plans,
        setPlans,
        selectedUnitId,
        setSelectedUnitId,
        selectedVenueId,
        setSelectedVenueId,
        handleTogglePower,
        handleSetTemp,
        handleToggleLock,
        handleToggleEventLock,
        handleAddEvent,
        handleDeleteEvent,
        handleToggleEvent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
