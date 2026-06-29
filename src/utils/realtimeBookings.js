import { createClient } from '@supabase/supabase-js';

// Anon-key client — used ONLY for Realtime subscriptions (read-only, RLS-enforced)
// All mutating API calls still go through the backend (httpOnly cookie auth)
const supabaseAnon = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || '',
);

/**
 * Subscribe to booking changes for a customer.
 * Calls onUpdate() whenever any booking row for this customer changes.
 * Returns an unsubscribe function.
 */
export const subscribeToBookings = (customerId, onUpdate) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return () => {};
  }
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
