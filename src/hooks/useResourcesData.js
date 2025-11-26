import { useQuery } from '@tanstack/react-query';
import { supabase, supabaseUrl } from '@/lib/customSupabaseClient';

const functionsBase = `${supabaseUrl}/functions/v1`;

/**
 * Hook to fetch lap files (resources) with caching
 * Cache key: ['lap-files', lapIds]
 */
export function useLapFiles(lapIds) {
  return useQuery({
    queryKey: ['lap-files', ...(lapIds || [])],
    queryFn: async () => {
      if (!lapIds || lapIds.length === 0) {
        return {};
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
      
      const res = await fetch(`${functionsBase}/lap-files?lap_ids=${encodeURIComponent(lapIds.join(','))}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...authHeader },
      });
      
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `lap-files failed (${res.status})`);
      }
      
      const payload = await res.json();
      return payload?.per_lap || {};
    },
    enabled: Boolean(lapIds && lapIds.length > 0),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to build resource groups from ADF data and lap files
 * This combines useAdfIds and useLapFiles
 */
export function useResourceGroups(adfData) {
  const adfIds = Array.isArray(adfData?.adf_ids) ? adfData.adf_ids : [];
  const lapIds = Array.isArray(adfData?.lap_ids) ? adfData.lap_ids : [];
  const adfToLapIds = adfData?.adf_to_lap_ids || {};
  const adfTitles = adfData?.adf_titles || {};
  
  const { data: perLap, isLoading, error } = useLapFiles(lapIds);
  
  const groups = React.useMemo(() => {
    if (!perLap || Object.keys(perLap).length === 0) return [];
    
    const buildFilesFromLap = (lapBody) => {
      if (!lapBody) return [];
      if (Array.isArray(lapBody)) return lapBody;
      if (typeof lapBody === 'object') {
        const inner = lapBody?.fichiers;
        return Array.isArray(inner) ? inner : [];
      }
      return [];
    };
    
    return adfIds.map((adfId) => {
      const lapList = Array.isArray(adfToLapIds[adfId]) ? adfToLapIds[adfId] : [];
      const files = [];
      for (const lapId of lapList) {
        const lapBody = perLap?.[lapId];
        const lapFiles = buildFilesFromLap(lapBody);
        for (const f of lapFiles) files.push(f);
      }
      return { adfId, title: adfTitles?.[adfId] || `Formation ${adfId}`, files };
    }).filter(g => g.files.length > 0);
  }, [adfIds, perLap, adfToLapIds, adfTitles]);
  
  return { groups, isLoading, error };
}

// Need to import React for useMemo
import React from 'react';

