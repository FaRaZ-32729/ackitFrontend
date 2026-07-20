import api from './axios';
import type { SubscriptionPlan } from '../types';

export type PlanType = 'free' | 'basic' | 'premium' | 'custom';

/** Raw plan document from the backend */
export interface ApiPlan {
  _id: string;
  name: string;
  type: PlanType;
  description?: string;
  price: number;
  durationDays: number;
  maxOrganizations: number;
  maxVenues: number;
  maxDevices: number;
  maxUsers: number;
  isActive?: boolean;
  isCustom?: boolean;
  assignedToEmail?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlanPayload {
  name: string;
  type: PlanType;
  description?: string;
  price: number;
  durationDays: number;
  maxOrganizations: number;
  maxVenues: number;
  maxDevices: number;
  maxUsers: number;
  assignedToEmail?: string;
}

export interface CreatePlanResponse {
  success: boolean;
  message: string;
  plan: ApiPlan;
  subscription?: {
    id: string;
    assignedEmail: string;
    userId: string | null;
    status: string;
  } | null;
}

export function mapApiPlanToSubscriptionPlan(plan: ApiPlan): SubscriptionPlan {
  return {
    id: plan._id,
    name: plan.name,
    maxOrgs: plan.maxOrganizations,
    maxVenues: plan.maxVenues,
    maxDevices: plan.maxDevices,
    maxUsers: plan.maxUsers,
    planType: plan.type,
    description: plan.description,
    pricePkr: plan.price,
    durationDays: plan.durationDays,
    assignedToEmail: plan.assignedToEmail ?? undefined,
    reportVisibility: [],
  };
}

export async function getAllPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await api.get<{ success: boolean; plans: ApiPlan[] }>(
    '/api/subscription/get-all-plans'
  );
  return (data.plans || []).map(mapApiPlanToSubscriptionPlan);
}

export async function createPlan(payload: CreatePlanPayload): Promise<CreatePlanResponse> {
  const { data } = await api.post<CreatePlanResponse>(
    '/api/subscription/create-plan',
    payload
  );
  return data;
}

/** Public catalog plans managers can buy (excludes custom) */
export async function getPurchasablePlans(): Promise<SubscriptionPlan[]> {
  const plans = await getAllPlans();
  return plans.filter((plan) => {
    const type = plan.planType || 'basic';
    return (type === 'free' || type === 'basic' || type === 'premium') && !plan.assignedToEmail;
  });
}

export interface PurchasePlanResponse {
  success: boolean;
  message: string;
  subscription: {
    id: string;
    plan: string;
    startDate: string;
    endDate: string;
  };
  user: {
    isActive: boolean;
    currentSubscription: string;
  };
}

export async function purchasePlan(planId: string): Promise<PurchasePlanResponse> {
  const { data } = await api.post<PurchasePlanResponse>(
    '/api/subscription/purchase',
    { planId }
  );
  return data;
}

export async function getMySubscription() {
  const { data } = await api.get('/api/subscription/my-subscription');
  return data;
}
