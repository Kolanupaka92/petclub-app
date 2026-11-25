// Author: Sai Kolanupaka
import { createClient } from '@supabase/supabase-js';

// Anon-key client — used ONLY for Realtime subscriptions (read-only, RLS-enforced)
// Only created when both env vars are present — createClient throws on empty strings
const _url = import.meta.env.VITE_SUPABASE_URL;
const _key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabaseAnon = (_url && _key) ? createClient(_url, _key) : null;

/**
 * Subscribe to booking changes for a customer.
 * Calls onUpdate() whenever any booking row for this customer changes.
 * Returns an unsubscribe function.
 */
export const subscribeToBookings = (customerId, onUpdate) => {
  if (!supabaseAnon) return () => {};
  const channel = supabaseAnon
    .channel(`bookings:customer:${customerId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'bookings',
      filter: `customer_id=eq.${customerId}`,
    }, () => onUpdate())
    .subscribe();

  return () => { supabaseAnon.removeChannel(channel); };
};
