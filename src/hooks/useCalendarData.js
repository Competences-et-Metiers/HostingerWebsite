import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Hook to fetch calendar sessions with caching
 * Cache key: ['calendar-sessions', participantId, adfIds]
 * Fetches all sessions for a participant, optionally filtered by ADF IDs
 */
export function useCalendarSessions(participantId, adfIds) {
  return useQuery({
    queryKey: ['calendar-sessions', participantId, ...(adfIds || [])],
    queryFn: async () => {
      if (!participantId) {
        return [];
      }
      
      const { data, error } = await supabase.functions.invoke('calendar', {
        body: { 
          participantId: String(participantId),
          adfIds: adfIds || []
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

