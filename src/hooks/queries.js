// Author: Sai Kolanupaka
// ══════════════════════════════════════════════════════════════════
//  Data hooks — React Query wrappers over the api layer
//
//  Adopt these incrementally in place of manual useEffect + useState +
//  fetch blocks. Each gives caching, dedup, background refresh, and
//  retry-with-backoff automatically. Writes use useMutation and
//  invalidate the relevant query key so the UI updates without a manual
//  refetch.
//
//  Example — before:
//    const [pets, setPets] = useState([]);
//    useEffect(() => { api.getPets().then(r => setPets(r.pets)); }, []);
//  after:
//    const { data: pets = [], isLoading } = usePets();
// ══════════════════════════════════════════════════════════════════
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api.js";
import { qk } from "../queryClient.js";

/* ── Reads ── */
export const useMe             = (opts = {}) => useQuery({ queryKey: qk.me,             queryFn: api.getMe,             ...opts });
export const usePets           = (opts = {}) => useQuery({ queryKey: qk.pets,           queryFn: api.getPets,           ...opts });
export const useBookings       = (opts = {}) => useQuery({ queryKey: qk.bookings,       queryFn: api.getBookings,       ...opts });
export const useLoyalty        = (opts = {}) => useQuery({ queryKey: qk.loyalty,        queryFn: api.getLoyalty,        ...opts });
export const useServiceCatalog = (opts = {}) => useQuery({ queryKey: qk.serviceCatalog, queryFn: api.getServiceCatalog, staleTime: 5 * 60_000, ...opts });
export const useEarnings       = (opts = {}) => useQuery({ queryKey: qk.earnings,       queryFn: api.getEarnings,       ...opts });

// Live tracking: poll every 5s while enabled (SSE-backed endpoint, but
// polling here keeps the hook simple and resilient).
export const useTracking = (bookingId, opts = {}) =>
  useQuery({
    queryKey: qk.tracking(bookingId),
    queryFn: () => api.getTracking(bookingId),
    enabled: !!bookingId,
    refetchInterval: 5000,
    staleTime: 0,
    ...opts,
  });

/* ── Writes ── */
// After a booking mutation, refresh the bookings list + loyalty (credits
// may have changed) without a manual refetch.
export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createBooking,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.bookings });
      qc.invalidateQueries({ queryKey: qk.loyalty });
    },
  });
}

export function useRespondBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }) => api.respondBooking(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.bookings });
      qc.invalidateQueries({ queryKey: qk.incomingBookings });
    },
  });
}
