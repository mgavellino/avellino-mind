import { ReactNode } from 'react';

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_period: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  max_patients: number | null;
  max_records: number | null;
}

export interface Appointment {
  id: string;
  psychologist_id: string;
  patient_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_payment_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: 'stripe' | 'manual';
  billing_period_start?: string;
  billing_period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPermissions {
  id: string;
  user_id: string;
  permission: string;
  plan_id?: string;
  created_at: string;
}

export interface AdminTier {
  user: 'user' | 'admin' | 'master_admin';
  plan: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status: 'active' | 'inactive' | 'cancelled';
}
