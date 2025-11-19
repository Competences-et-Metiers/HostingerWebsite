import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Hook to fetch calendar sessions with caching
 * Cache key: ['calendar-sessions', adfIds]
 * Depends on adfIds array
 */
export function useCalendarSessions(adfIds) {
  return useQuery({
    queryKey: ['calendar-sessions', ...(adfIds || [])],
    queryFn: async () => {
      if (!adfIds || adfIds.length === 0) {
        return [];
      }
      
      const { data, error } = await supabase.functions.invoke('calendar', {
        body: { adfIds },
      });
      
      if (error) throw error;
      
      // Expecting array; if wrapped, try to unwrap
      const result = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      return result;
    },
    enabled: Boolean(adfIds && adfIds.length > 0),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

