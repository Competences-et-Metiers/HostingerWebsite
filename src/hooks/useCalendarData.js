import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Hook to fetch calendar sessions with caching
 * Cache key: ['calendar-sessions', participantId]
 * Fetches ALL sessions for a participant (no ADF filtering)
 */
export function useCalendarSessions(participantId) {
  return useQuery({
    queryKey: ['calendar-sessions', participantId],
    queryFn: async () => {
      if (!participantId) {
        return [];
      }
      
      const { data, error } = await supabase.functions.invoke('calendar', {
        body: { 
          participantId: String(participantId)
        },
      });
      
      if (error) throw error;
      
      // Expecting array; if wrapped, try to unwrap
      const result = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      return result;
    },
    enabled: Boolean(participantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

