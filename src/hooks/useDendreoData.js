import { useQuery, useQueries } from '@tanstack/react-query';
import { 
  fetchAdfCompetencies, 
  fetchAdfIds, 
  fetchConsultantsByAdfIds,
  fetchStaffById 
} from '@/lib/dendreo';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Hook to fetch ADF IDs with caching
 * Cache key: ['adf-ids']
 * Stale time: 5 minutes (configured in queryClient)
 */
export function useAdfIds() {
  return useQuery({
    queryKey: ['adf-ids'],
    queryFn: fetchAdfIds,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch ADF competencies with caching
 * Cache key: ['adf-competencies']
 * Stale time: 5 minutes
 */
export function useAdfCompetencies() {
  return useQuery({
    queryKey: ['adf-competencies'],
    queryFn: fetchAdfCompetencies,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch ADF metrics (hours) for a specific ADF ID
 * Cache key: ['adf-metrics', adfId]
 */
export function useAdfMetrics(adfId, enabled = true) {
  return useQuery({
    queryKey: ['adf-metrics', adfId],
    queryFn: async () => {
      const { supabase, supabaseUrl, supabaseAnonKey } = await import('@/lib/customSupabaseClient');
      const functionsBase = supabaseUrl.replace('supabase.co', 'functions.supabase.co');
      const url = `${functionsBase}/test?id=${encodeURIComponent(adfId)}`;
      
      let authHeader = supabaseAnonKey;
      try {
        const { data } = await supabase.auth.getSession();
        const jwt = data?.session?.access_token;
        if (jwt) authHeader = `Bearer ${jwt}`;
      } catch (_) {}
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: authHeader
        }
      });
      
      if (!res.ok) throw new Error(`Failed to fetch metrics for ADF ${adfId}`);
      return res.json();
    },
    enabled: enabled && !!adfId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch multiple ADF metrics in parallel
 * Returns an object with loading, error states and data for all ADFs
 */
export function useMultipleAdfMetrics(adfIds) {
  const results = useQueries({
    queries: (adfIds || []).map((id) => ({
      queryKey: ['adf-metrics', id],
      queryFn: async () => {
        const { supabase, supabaseUrl, supabaseAnonKey } = await import('@/lib/customSupabaseClient');
        const functionsBase = supabaseUrl.replace('supabase.co', 'functions.supabase.co');
        const url = `${functionsBase}/test?id=${encodeURIComponent(id)}`;
        
        let authHeader = supabaseAnonKey;
        try {
          const { data } = await supabase.auth.getSession();
          const jwt = data?.session?.access_token;
          if (jwt) authHeader = `Bearer ${jwt}`;
        } catch (_) {}
        
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: authHeader
          }
        });
        
        if (!res.ok) throw new Error(`Failed to fetch metrics for ADF ${id}`);
        const payload = await res.json();
        
        return {
          id: String(payload.id || id),
          title: typeof payload.intitule === 'string' && payload.intitule.trim() 
            ? payload.intitule.trim() 
            : undefined,
          spent_hours: Number(payload.spent_hours ?? 0) || 0,
          total_hours: Number(payload.total_hours ?? 0) || 0,
        };
      },
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    })),
  });

  // Aggregate the results
  const isLoading = results.some(r => r.isLoading);
  const isError = results.some(r => r.isError);
  const data = results.map(r => r.data).filter(Boolean);

  return {
    isLoading,
    isError,
    data,
    queries: results,
  };
}

