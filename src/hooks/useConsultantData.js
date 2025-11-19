import { useQuery } from '@tanstack/react-query';
import { fetchConsultantsByAdfIds, fetchStaffById } from '@/lib/dendreo';

/**
 * Hook to fetch consultants for given ADF IDs
 * Cache key: ['consultants', adfIds]
 */
export function useConsultants(adfIds) {
  return useQuery({
    queryKey: ['consultants', ...(adfIds || [])],
    queryFn: async () => {
      if (!adfIds || adfIds.length === 0) {
        return [];
      }
      
      const result = await fetchConsultantsByAdfIds(adfIds);
      return Array.isArray(result?.consultants) ? result.consultants : [];
    },
    enabled: Boolean(adfIds && adfIds.length > 0),
    staleTime: 10 * 60 * 1000, // 10 minutes - consultants change rarely
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch staff member by ID
 * Cache key: ['staff', staffId]
 */
export function useStaff(staffId) {
  return useQuery({
    queryKey: ['staff', staffId],
    queryFn: async () => {
      if (!staffId) return null;
      return await fetchStaffById(staffId);
    },
    enabled: Boolean(staffId),
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
}

