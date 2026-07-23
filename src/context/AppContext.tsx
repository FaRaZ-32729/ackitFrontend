import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Role, 
  ACUnit, 
  ACEvent, 
  ManagerAccount, 
  UserAccount, 
  Organization, 
  Venue, 
  SubscriptionPlan,
  AuthUser,
} from '../types';
import { 
  mockACUnits, 
} from '../data';
import { login as loginRequest, getMe, logout as logoutRequest } from '../api/authApi';
import {
  getAllPlans,
  createPlan as createPlanRequest,
  CreatePlanPayload,
  mapApiPlanToSubscriptionPlan,
  purchasePlan as purchasePlanRequest,
} from '../api/planApi';
import { getStoredToken, setStoredToken } from '../api/axios';
import { getAllManagers, suspendManager as suspendManagerRequest, deleteManager as deleteManagerRequest } from '../api/managerApi';
import {
  getMyOrganizations,
  getAllOrganizations as getAllOrganizationsRequest,
  createOrganization as createOrganizationRequest,
  updateOrganization as updateOrganizationRequest,
  deleteOrganization as deleteOrganizationRequest,
} from '../api/orgApi';
import {
  getMyVenues as getMyVenuesRequest,
  getAllVenues as getAllVenuesRequest,
  createVenue as createVenueRequest,
  updateVenue as updateVenueRequest,
  deleteVenue as deleteVenueRequest,
} from '../api/venueApi';
import {
  getUsersByManager as getUsersByManagerRequest,
  createSubUser as createSubUserRequest,
  updateSubUser as updateSubUserRequest,
  deleteSubUser as deleteSubUserRequest,
  CreateSubUserPayload,
  UpdateSubUserPayload,
} from '../api/userApi';
import axios from 'axios';
import { getAppSocket } from '../api/brandSocket';

const USER_KEY = 'iotify_user';

interface AppContextType {
  role: Role | null;
  setRole: (role: Role | null) => void;
  user: AuthUser | null;
  token: string | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  hasActiveSubscription: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  purchasePlan: (planId: string) => Promise<void>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  units: ACUnit[];
  setUnits: React.Dispatch<React.SetStateAction<ACUnit[]>>;
  managers: ManagerAccount[];
  setManagers: React.Dispatch<React.SetStateAction<ManagerAccount[]>>;
  managersLoading: boolean;
  managersError: string | null;
  fetchManagers: () => Promise<void>;
  suspendManager: (
    managerId: string,
    isActive: boolean,
    suspensionReason?: string
  ) => Promise<void>;
  deleteManager: (managerId: string) => Promise<void>;
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  usersLoading: boolean;
  usersError: string | null;
  fetchMyUsers: () => Promise<void>;
  fetchUsersByManager: (managerId: string) => Promise<void>;
  createSubUser: (payload: CreateSubUserPayload) => Promise<UserAccount>;
  updateSubUser: (id: string, payload: UpdateSubUserPayload) => Promise<UserAccount>;
  deleteSubUser: (id: string) => Promise<void>;
  orgs: Organization[];
  setOrgs: React.Dispatch<React.SetStateAction<Organization[]>>;
  orgsLoading: boolean;
  orgsError: string | null;
  fetchMyOrganizations: () => Promise<void>;
  fetchAllOrganizations: () => Promise<void>;
  createOrganization: (name: string, address?: string) => Promise<Organization>;
  updateOrganization: (
    id: string,
    name: string,
    address?: string
  ) => Promise<Organization>;
  deleteOrganization: (id: string) => Promise<void>;
  venues: Venue[];
  setVenues: React.Dispatch<React.SetStateAction<Venue[]>>;
  venuesLoading: boolean;
  venuesError: string | null;
  fetchMyVenues: () => Promise<void>;
  fetchAllVenues: () => Promise<void>;
  createVenue: (name: string, organizationId: string) => Promise<Venue>;
  updateVenue: (
    id: string,
    payload: { name?: string; organizationId?: string }
  ) => Promise<Venue>;
  deleteVenue: (id: string) => Promise<void>;
  plans: SubscriptionPlan[];
  setPlans: React.Dispatch<React.SetStateAction<SubscriptionPlan[]>>;
  plansLoading: boolean;
  plansError: string | null;
  fetchPlans: () => Promise<void>;
  createPlan: (payload: CreatePlanPayload) => Promise<SubscriptionPlan>;
  selectedUnitId: string | null;
  setSelectedUnitId: (id: string | null) => void;
  selectedVenueId: string | null;
  setSelectedVenueId: (id: string | null) => void;
  selectedOrgId: string | null;
  setSelectedOrgId: (id: string | null) => void;
  
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

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => {
    const saved = localStorage.getItem('iotify_role');
    return saved ? (saved as Role) : null;
  });
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? (JSON.parse(saved) as AuthUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [authLoading, setAuthLoading] = useState(!!getStoredToken());

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [units, setUnits] = useState<ACUnit[]>(() => {
    const saved = localStorage.getItem('iotify_units');
    return saved ? JSON.parse(saved) : mockACUnits;
  });
  const [managers, setManagers] = useState<ManagerAccount[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [managersError, setManagersError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgsError, setOrgsError] = useState<string | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [venuesError, setVenuesError] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const persistSession = useCallback((nextToken: string | null, nextUser: AuthUser | null) => {
    setToken(nextToken);
    setStoredToken(nextToken);
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setRole(nextUser.role);
    } else {
      localStorage.removeItem(USER_KEY);
      setRole(null);
    }
  }, []);

  const mapMeToAuthUser = (me: any): AuthUser => {
    const assignedVenueIds = Array.isArray(me.venues)
      ? me.venues
          .map((v: any) => String(v?.venueId?._id || v?.venueId || ''))
          .filter(Boolean)
      : [];
    const organizationIds = Array.isArray(me.organizations)
      ? me.organizations
          .map((org: any) => String(org?._id || org || ''))
          .filter(Boolean)
      : [];

    return {
      id: String(me.id || me._id),
      name: me.name,
      email: me.email,
      role: me.role,
      isActive: me.isActive ?? true,
      permission: me.permission ?? null,
      currentSubscription: me.currentSubscription
        ? String(me.currentSubscription._id || me.currentSubscription)
        : null,
      assignedVenueIds,
      organizationIds,
    };
  };

  const hydrateWorkspaceFromMe = useCallback((me: any) => {
    if (!me || me.role !== 'user') return;

    const nextVenues: Venue[] = Array.isArray(me.venues)
      ? me.venues
          .map((v: any) => {
            const id = String(v?.venueId?._id || v?.venueId || '');
            if (!id) return null;
            return {
              id,
              name: String(v?.venueName || v?.venueId?.name || 'Venue'),
              orgId: String(v?.organization?.id || v?.organization?._id || ''),
              orgName: v?.organization?.name,
            } as Venue;
          })
          .filter(Boolean)
      : [];

    const orgMap = new Map<string, Organization>();
    nextVenues.forEach((venue) => {
      if (!venue.orgId) return;
      if (!orgMap.has(venue.orgId)) {
        orgMap.set(venue.orgId, {
          id: venue.orgId,
          name: venue.orgName || 'Organization',
          managerId: '',
        });
      }
    });
    if (Array.isArray(me.organizations)) {
      me.organizations.forEach((org: any) => {
        const id = String(org?._id || org || '');
        if (!id) return;
        if (!orgMap.has(id)) {
          orgMap.set(id, {
            id,
            name: String(org?.name || 'Organization'),
            managerId: '',
          });
        }
      });
    }

    setVenues(nextVenues);
    setOrgs(Array.from(orgMap.values()));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email, password);
    const nextUser: AuthUser = {
      id: String(data.user.id),
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      isActive: data.user.isActive,
      permission: data.user.permission ?? null,
      currentSubscription: data.user.currentSubscription
        ? String(data.user.currentSubscription)
        : null,
      assignedVenueIds: data.user.assignedVenueIds || [],
      organizationIds: data.user.organizationIds || [],
    };
    persistSession(data.token, nextUser);
    if (nextUser.role === 'user') {
      try {
        const meData = await getMe();
        const me = meData.user || meData;
        const enriched = mapMeToAuthUser(me);
        persistSession(data.token, enriched);
        hydrateWorkspaceFromMe(me);
        return enriched;
      } catch {
        // Keep login session even if /me enrichment fails
      }
    }
    return nextUser;
  }, [persistSession, hydrateWorkspaceFromMe]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Clear local session even if API fails
    }
    persistSession(null, null);
    setSelectedUnitId(null);
    setUsers([]);
    setOrgs([]);
    setVenues([]);
  }, [persistSession]);

  const refreshUser = useCallback(async () => {
    const data = await getMe();
    const me = data.user || data;
    const nextUser = mapMeToAuthUser(me);
    persistSession(getStoredToken(), nextUser);
    hydrateWorkspaceFromMe(me);
    return nextUser;
  }, [persistSession, hydrateWorkspaceFromMe]);

  const purchasePlan = useCallback(async (planId: string) => {
    const result = await purchasePlanRequest(planId);
    setUser((prev) => {
      if (!prev) return prev;
      const nextUser: AuthUser = {
        ...prev,
        isActive: result.user.isActive ?? prev.isActive,
        currentSubscription: String(result.user.currentSubscription),
      };
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const hasActiveSubscription = Boolean(user?.currentSubscription);

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const nextPlans = await getAllPlans();
      setPlans(nextPlans);
    } catch (err) {
      setPlansError(getApiErrorMessage(err, 'Failed to load plans'));
      throw err;
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const fetchManagers = useCallback(async () => {
    setManagersLoading(true);
    setManagersError(null);
    try {
      const nextManagers = await getAllManagers();
      setManagers(nextManagers);
    } catch (err) {
      setManagersError(getApiErrorMessage(err, 'Failed to load managers'));
      throw err;
    } finally {
      setManagersLoading(false);
    }
  }, []);

  const suspendManager = useCallback(
    async (managerId: string, isActive: boolean, suspensionReason?: string) => {
      const updated = await suspendManagerRequest(
        managerId,
        isActive,
        suspensionReason
      );
      setManagers((prev) =>
        prev.map((manager) => {
          if (manager.id !== managerId) return manager;
          if (manager.status === 'pending') {
            return {
              ...manager,
              status: updated.isActive ? 'pending' : 'inactive',
            };
          }
          return {
            ...manager,
            status: updated.isActive ? 'active' : 'inactive',
          };
        })
      );
      if (!isActive) {
        setUsers((prev) =>
          prev.map((item) =>
            item.managerId === managerId
              ? { ...item, status: 'inactive' as const }
              : item
          )
        );
      } else {
        setUsers((prev) =>
          prev.map((item) =>
            item.managerId === managerId && item.status === 'inactive'
              ? { ...item, status: 'active' as const }
              : item
          )
        );
      }
    },
    []
  );

  const deleteManager = useCallback(async (managerId: string) => {
    await deleteManagerRequest(managerId);
    setManagers((prev) => prev.filter((manager) => manager.id !== managerId));
    setOrgs((prev) => {
      const removedOrgIds = new Set(
        prev.filter((org) => org.managerId === managerId).map((org) => org.id)
      );
      setVenues((venuesPrev) =>
        venuesPrev.filter((venue) => !removedOrgIds.has(venue.orgId))
      );
      return prev.filter((org) => org.managerId !== managerId);
    });
    setUsers((prev) => prev.filter((item) => item.managerId !== managerId));
  }, []);

  const createPlan = useCallback(async (payload: CreatePlanPayload) => {
    const data = await createPlanRequest(payload);
    const mapped = mapApiPlanToSubscriptionPlan(data.plan);
    setPlans((prev) => {
      const without = prev.filter((p) => p.id !== mapped.id);
      return [...without, mapped].sort((a, b) => (a.pricePkr ?? 0) - (b.pricePkr ?? 0));
    });
    return mapped;
  }, []);

  const fetchMyOrganizations = useCallback(async () => {
    setOrgsLoading(true);
    setOrgsError(null);
    try {
      const nextOrgs = await getMyOrganizations();
      setOrgs(
        nextOrgs.map((org) => ({
          ...org,
          managerId: org.managerId || user?.id || '',
        }))
      );
    } catch (err) {
      setOrgsError(getApiErrorMessage(err, 'Failed to load organizations'));
      throw err;
    } finally {
      setOrgsLoading(false);
    }
  }, [user?.id]);

  const fetchAllOrganizations = useCallback(async () => {
    setOrgsLoading(true);
    setOrgsError(null);
    try {
      const nextOrgs = await getAllOrganizationsRequest();
      setOrgs(nextOrgs);
    } catch (err) {
      setOrgsError(getApiErrorMessage(err, 'Failed to load organizations'));
      throw err;
    } finally {
      setOrgsLoading(false);
    }
  }, []);

  const createOrganization = useCallback(async (name: string, address?: string) => {
    const org = await createOrganizationRequest(name, address);
    const withOwner = {
      ...org,
      managerId: org.managerId || user?.id || '',
    };
    setOrgs((prev) => {
      if (prev.some((item) => item.id === withOwner.id)) return prev;
      return [withOwner, ...prev];
    });
    return withOwner;
  }, [user?.id]);

  const updateOrganization = useCallback(async (id: string, name: string, address?: string) => {
    const updated = await updateOrganizationRequest(id, name, address);
    setOrgs((prev) =>
      prev.map((org) =>
        org.id === id
          ? {
              ...org,
              name: updated.name,
              address: updated.address,
              managerId: updated.managerId || org.managerId,
            }
          : org
      )
    );
    return updated;
  }, []);

  const deleteOrganization = useCallback(async (id: string) => {
    await deleteOrganizationRequest(id);
    setOrgs((prev) => prev.filter((org) => org.id !== id));
    setVenues((prev) => prev.filter((venue) => venue.orgId !== id));
  }, []);

  const fetchMyVenues = useCallback(async () => {
    setVenuesLoading(true);
    setVenuesError(null);
    try {
      const nextOrgs = await getMyOrganizations();
      const withOwner = nextOrgs.map((org) => ({
        ...org,
        managerId: org.managerId || user?.id || '',
      }));
      setOrgs(withOwner);
      const nextVenues = await getMyVenuesRequest(withOwner.map((org) => org.id));
      setVenues(nextVenues);
    } catch (err) {
      setVenuesError(getApiErrorMessage(err, 'Failed to load venues'));
      throw err;
    } finally {
      setVenuesLoading(false);
    }
  }, [user?.id]);

  const fetchAllVenues = useCallback(async () => {
    setVenuesLoading(true);
    setVenuesError(null);
    try {
      const nextVenues = await getAllVenuesRequest();
      setVenues(nextVenues);
    } catch (err) {
      setVenuesError(getApiErrorMessage(err, 'Failed to load venues'));
      throw err;
    } finally {
      setVenuesLoading(false);
    }
  }, []);

  const createVenue = useCallback(async (name: string, organizationId: string) => {
    const venue = await createVenueRequest(name, organizationId);
    setVenues((prev) => {
      if (prev.some((item) => item.id === venue.id)) return prev;
      return [venue, ...prev];
    });
    return venue;
  }, []);

  const updateVenue = useCallback(
    async (id: string, payload: { name?: string; organizationId?: string }) => {
      const updated = await updateVenueRequest(id, payload);
      setVenues((prev) =>
        prev.map((venue) => (venue.id === id ? { ...venue, ...updated } : venue))
      );
      return updated;
    },
    []
  );

  const deleteVenue = useCallback(async (id: string) => {
    await deleteVenueRequest(id);
    setVenues((prev) => prev.filter((venue) => venue.id !== id));
  }, []);

  const fetchMyUsers = useCallback(async () => {
    if (!user?.id) {
      setUsers([]);
      return;
    }
    setUsersLoading(true);
    setUsersError(null);
    try {
      const nextUsers = await getUsersByManagerRequest(user.id);
      setUsers(
        nextUsers.map((item) => ({
          ...item,
          managerId: item.managerId || user.id,
        }))
      );
    } catch (err) {
      setUsersError(getApiErrorMessage(err, 'Failed to load users'));
      throw err;
    } finally {
      setUsersLoading(false);
    }
  }, [user?.id]);

  const fetchUsersByManager = useCallback(async (managerId: string) => {
    if (!managerId) return;
    setUsersLoading(true);
    setUsersError(null);
    try {
      const nextUsers = await getUsersByManagerRequest(managerId);
      const mapped = nextUsers.map((item) => ({
        ...item,
        managerId: item.managerId || managerId,
      }));
      setUsers((prev) => {
        const others = prev.filter((item) => item.managerId !== managerId);
        return [...others, ...mapped];
      });
    } catch (err) {
      setUsersError(getApiErrorMessage(err, 'Failed to load users'));
      throw err;
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const createSubUser = useCallback(async (payload: CreateSubUserPayload) => {
    const created = await createSubUserRequest(payload);
    const withManager = {
      ...created,
      managerId: created.managerId || user?.id || '',
    };
    setUsers((prev) => {
      if (prev.some((item) => item.id === withManager.id)) return prev;
      return [withManager, ...prev];
    });
    return withManager;
  }, [user?.id]);

  const updateSubUser = useCallback(async (id: string, payload: UpdateSubUserPayload) => {
    const updated = await updateSubUserRequest(id, payload);
    setUsers((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updated,
              managerId: updated.managerId || item.managerId,
            }
          : item
      )
    );
    return updated;
  }, []);

  const deleteSubUser = useCallback(async (id: string) => {
    await deleteSubUserRequest(id);
    setUsers((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Restore session from token
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const stored = getStoredToken();
      if (!stored) {
        setAuthLoading(false);
        return;
      }
      try {
        const data = await getMe();
        if (cancelled) return;
        const me = data.user || data;
        const nextUser = mapMeToAuthUser(me);
        persistSession(stored, nextUser);
        hydrateWorkspaceFromMe(me);
      } catch {
        if (!cancelled) persistSession(null, null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };
    restore();
    return () => {
      cancelled = true;
    };
  }, [persistSession, hydrateWorkspaceFromMe]);

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

  // Live device power/temp from ESP (app control OR physical remote)
  useEffect(() => {
    if (!token || (role !== 'manager' && role !== 'user' && role !== 'admin')) {
      return;
    }

    const socket = getAppSocket();
    const onDeviceState = (payload: {
      id?: string;
      deviceId?: string;
      state?: 'on' | 'off';
      isOn?: boolean;
      temperature?: number;
      current?: number;
      voltage?: number;
      powerConsumption?: number;
      ventTemperature?: number | null;
      health?: 'healthy' | 'faulty';
      healthAlert?: string;
      hasFault?: boolean;
    }) => {
      if (!payload?.id) return;

      const patch: Partial<ACUnit> = {};
      if (typeof payload.isOn === 'boolean') {
        patch.isOn = payload.isOn;
      } else if (payload.state === 'on' || payload.state === 'off') {
        patch.isOn = payload.state === 'on';
      }
      if (
        typeof payload.temperature === 'number' &&
        payload.temperature >= 16 &&
        payload.temperature <= 30
      ) {
        patch.targetTemp = payload.temperature;
        patch.currentTemp = payload.temperature;
      }
      if (typeof payload.current === 'number' && payload.current >= 0) {
        patch.current = payload.current;
      }
      if (typeof payload.voltage === 'number' && payload.voltage > 0) {
        patch.voltage = payload.voltage;
      }
      if (typeof payload.powerConsumption === 'number' && payload.powerConsumption >= 0) {
        patch.powerConsumption = payload.powerConsumption;
      }
      if (typeof payload.ventTemperature === 'number') {
        patch.ventTemperature = payload.ventTemperature;
      }
      if (typeof payload.hasFault === 'boolean') {
        patch.hasFault = payload.hasFault;
      } else if (payload.health === 'faulty' || payload.health === 'healthy') {
        patch.hasFault = payload.health === 'faulty';
      }
      if (typeof payload.healthAlert === 'string') {
        patch.healthAlert = payload.healthAlert;
      }
      if (Object.keys(patch).length === 0) return;

      setUnits((prev) => {
        const exists = prev.some((u) => u.id === payload.id);
        if (!exists) {
          // Upsert a lightweight unit so dashboard can reflect live devices
          return [
            ...prev,
            {
              id: payload.id!,
              name: payload.deviceId || 'Device',
              venueId: '',
              isOn: patch.isOn ?? false,
              currentTemp: patch.currentTemp ?? 16,
              targetTemp: patch.targetTemp ?? 16,
              isLocked: false,
              eventLocked: false,
              hasFault: patch.hasFault ?? false,
              healthAlert: patch.healthAlert ?? '',
              voltage: patch.voltage ?? 230,
              current: patch.current ?? 0,
              powerConsumption: patch.powerConsumption ?? 0,
              ventTemperature: patch.ventTemperature ?? null,
              energyConsumption: {
                hourly: [{ label: '00:00', kwh: 0 }],
                daily: [{ label: new Date().toISOString().split('T')[0], kwh: 0 }],
                weekly: [{ label: 'Week 1', kwh: 0 }],
                monthly: [{ label: new Date().toISOString().slice(0, 7), kwh: 0 }],
                yearly: [{ label: new Date().getFullYear().toString(), kwh: 0 }],
              },
              events: [],
            },
          ];
        }
        return prev.map((u) => (u.id === payload.id ? { ...u, ...patch } : u));
      });
    };

    socket.on('device:state', onDeviceState);

    const onDeviceAlert = (payload: {
      id?: string;
      hasFault?: boolean;
      health?: 'healthy' | 'faulty';
      healthAlert?: string;
      ventTemperature?: number;
    }) => {
      if (!payload?.id) return;
      const patch: Partial<ACUnit> = {};
      if (typeof payload.hasFault === 'boolean') {
        patch.hasFault = payload.hasFault;
      } else if (payload.health === 'faulty' || payload.health === 'healthy') {
        patch.hasFault = payload.health === 'faulty';
      }
      if (typeof payload.healthAlert === 'string') {
        patch.healthAlert = payload.healthAlert;
      }
      if (typeof payload.ventTemperature === 'number') {
        patch.ventTemperature = payload.ventTemperature;
      }
      if (Object.keys(patch).length === 0) return;
      setUnits((prev) =>
        prev.map((u) => (u.id === payload.id ? { ...u, ...patch } : u))
      );
    };

    socket.on('device:alert', onDeviceAlert);

    const onDeviceRemote = (payload: {
      id?: string;
      remote?: 'unlock' | 'lock' | 'superlock';
      isLocked?: boolean;
      eventLocked?: boolean;
    }) => {
      if (!payload?.id) return;
      const patch: Partial<ACUnit> = {
        isLocked: Boolean(payload.isLocked),
        eventLocked: Boolean(payload.eventLocked),
      };
      if (payload.remote === 'unlock') {
        patch.isLocked = false;
        patch.eventLocked = false;
      } else if (payload.remote === 'lock') {
        patch.isLocked = true;
        patch.eventLocked = false;
      } else if (payload.remote === 'superlock') {
        patch.isLocked = true;
        patch.eventLocked = true;
      }
      setUnits((prev) =>
        prev.map((u) => (u.id === payload.id ? { ...u, ...patch } : u))
      );
    };

    socket.on('device:remote', onDeviceRemote);
    return () => {
      socket.off('device:state', onDeviceState);
      socket.off('device:alert', onDeviceAlert);
      socket.off('device:remote', onDeviceRemote);
    };
  }, [token, role]);

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
        user,
        token,
        authLoading,
        login,
        logout,
        hasActiveSubscription,
        refreshUser,
        purchasePlan,
        activeTab,
        setActiveTab,
        isSidebarOpen,
        setIsSidebarOpen,
        units,
        setUnits,
        managers,
        setManagers,
        managersLoading,
        managersError,
        fetchManagers,
        suspendManager,
        deleteManager,
        users,
        setUsers,
        usersLoading,
        usersError,
        fetchMyUsers,
        fetchUsersByManager,
        createSubUser,
        updateSubUser,
        deleteSubUser,
        orgs,
        setOrgs,
        orgsLoading,
        orgsError,
        fetchMyOrganizations,
        fetchAllOrganizations,
        createOrganization,
        updateOrganization,
        deleteOrganization,
        venues,
        setVenues,
        venuesLoading,
        venuesError,
        fetchMyVenues,
        fetchAllVenues,
        createVenue,
        updateVenue,
        deleteVenue,
        plans,
        setPlans,
        plansLoading,
        plansError,
        fetchPlans,
        createPlan,
        selectedUnitId,
        setSelectedUnitId,
        selectedVenueId,
        setSelectedVenueId,
        selectedOrgId,
        setSelectedOrgId,
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
