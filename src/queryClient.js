// Author: Sai Kolanupaka
// ══════════════════════════════════════════════════════════════════
//  React Query client — shared config
//
//  Gives every server read caching, dedup, background refetch, and
//  retry-with-backoff for free — the systemic fix for the ad-hoc
//  fetch/retry logic scattered through the app (e.g. the AddressPicker
//  401-refresh workaround).
//
//  Defaults tuned for a mobile PWA on flaky networks:
//   • retry transient failures 2× with capped exponential backoff
//   • DON'T retry auth failures — a 401 means "session expired", which
//     api.js already surfaces via the petclub:unauthorized event; a
//     retry would just hammer a dead session.
//   • staleTime 30s: avoids refetch storms while keeping data fresh.
//   • refetchOnWindowFocus: bookings/tracking should refresh when the
//     user returns to the tab, so leave it on.
// ══════════════════════════════════════════════════════════════════
import { QueryClient } from "@tanstack/react-query";

const isAuthError = (err) =>
  /session has expired|\(401\)|\(403\)/i.test(err?.message || "");

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, err) => !isAuthError(err) && failureCount < 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: {
      retry: (failureCount, err) => !isAuthError(err) && failureCount < 1,
    },
  },
});

// Central place for query keys so cache invalidation is consistent.
export const qk = {
  me: ["me"],
  pets: ["pets"],
  bookings: ["bookings"],
  incomingBookings: ["bookings", "incoming"],
  loyalty: ["loyalty"],
  serviceCatalog: ["services", "catalog"],
  earnings: ["professionals", "earnings"],
  myProProfile: ["professionals", "me"],
  tracking: (id) => ["bookings", id, "tracking"],
};
