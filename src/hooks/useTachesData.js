import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Hook to fetch participant tasks (including e-signatures) with caching
 * Cache key: ['participant-taches', participantId]
 */
export function useParticipantTaches(participantId) {
  return useQuery({
    queryKey: ['participant-taches', participantId],
    queryFn: async () => {
      if (!participantId) {
        return null;
      }
      
      const { data, error } = await supabase.functions.invoke('taches', {
        body: { 
          participantId: String(participantId)
        },
      });
      
      if (error) throw error;
      
      return data;
    },
    enabled: Boolean(participantId),
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter because e-signatures can be completed)
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

