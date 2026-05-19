import { supabase } from '@/integrations/supabase/client';
import type { PricingConfig, Subscription, PromoCode, LandingPageContent } from '@/types/saas.types';

// PRICING MANAGEMENT
export const pricingService = {
  async getPricingConfigs(): Promise<PricingConfig[]> {
    const { data, error } = await supabase
      .from('pricing_config')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async updatePricingConfig(id: string, updates: Partial<PricingConfig>): Promise<void> {
    const { error } = await supabase
      .from('pricing_config')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },
};

// SUBSCRIPTION MANAGEMENT
export const subscriptionService = {
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createSubscription(subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscription])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq('id', subscriptionId);

    if (error) throw error;
  },
};

// PROMO CODE MANAGEMENT
export const promoCodeService = {
  async validatePromoCode(code: string): Promise<PromoCode | null> {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    if (data.valid_until && new Date(data.valid_until) < new Date()) {
      return null;
    }

    if (data.max_uses && data.current_uses >= data.max_uses) {
      return null;
    }

    return data;
  },

  async createPromoCode(promo: Omit<PromoCode, 'id' | 'created_at' | 'current_uses'>): Promise<PromoCode> {
    const { data, error } = await supabase
      .from('promo_codes')
      .insert([{ ...promo, current_uses: 0 }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAllPromoCodes(): Promise<PromoCode[]> {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// LANDING PAGE CONTENT
export const landingPageService = {
  async getContent(key?: string): Promise<LandingPageContent[]> {
    let query = supabase
      .from('landing_page_content')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (key) {
      query = query.eq('key', key);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async updateContent(id: string, updates: Partial<LandingPageContent>): Promise<void> {
    const { error } = await supabase
      .from('landing_page_content')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },
};
