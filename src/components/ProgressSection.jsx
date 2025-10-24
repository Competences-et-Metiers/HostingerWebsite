import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const ProgressSection = () => {
  const { loading: authLoading } = useAuth();
  const [adfIds, setAdfIds] = useState([]);
  const [adfLoading, setAdfLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState([]); // { id, spent_hours, total_hours }

  // Load ADF IDs from edge function for authenticated user
  useEffect(() => {
    let isMounted = true;
    const loadAdfIds = async () => {
      if (authLoading) return;
      try {
        setAdfLoading(true);
        const controller = new AbortController();
        const functionsBase = supabaseUrl.replace('supabase.co', 'functions.supabase.co');
        const url = `${functionsBase}/get-adf`;
        let authHeader = supabaseAnonKey;
        try {
          const { data } = await supabase.auth.getSession();
          const jwt = data?.session?.access_token;
          if (jwt) authHeader = `Bearer ${jwt}`;
        } catch (_) {}
        const res = await fetch(url, {
          method: 'GET',
          headers: { apikey: supabaseAnonKey, Authorization: authHeader },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`get-adf ${res.status}`);
        const data = await res.json();
        const ids = Array.isArray(data?.adf_ids) ? data.adf_ids.map(String) : [];
        if (isMounted) setAdfIds(ids);
      } catch (err) {
        if (isMounted) setError(err?.message || 'Erreur lors de la récupération des ADF');
      } finally {
        if (isMounted) setAdfLoading(false);
      }
    };
    loadAdfIds();
    return () => { isMounted = false; };
  }, [authLoading]);

  // Fetch metrics for each ADF using the edge function that computes hours
  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      if (!adfIds || adfIds.length === 0) {
        setMetrics([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const functionsBase = supabaseUrl.replace('supabase.co', 'functions.supabase.co');
        let authHeader = supabaseAnonKey;
        try {
          const { data } = await supabase.auth.getSession();
          const jwt = data?.session?.access_token;
          if (jwt) authHeader = `Bearer ${jwt}`;
        } catch (_) {}
        const results = await Promise.allSettled(
          adfIds.map(async (id) => {
            const url = `${functionsBase}/test?id=${encodeURIComponent(id)}`;
            const res = await fetch(url, {
              method: 'GET',
              headers: { apikey: supabaseAnonKey, Authorization: authHeader },
            });
            if (!res.ok) throw new Error(`test ${res.status}`);
            const payload = await res.json();
            const spent = Number(payload.spent_hours ?? 0) || 0;
            const total = Number(payload.total_hours ?? 0) || 0;
            const title = typeof payload.intitule === 'string' && payload.intitule.trim() ? payload.intitule.trim() : undefined;
            return { id: String(payload.id || id), title, spent_hours: spent, total_hours: total };
          })
        );
        if (!isMounted) return;
        const ok = results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value);
        setMetrics(ok);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || 'Erreur lors du chargement des métriques');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAll();
    // join in dep to avoid ref churn
    return () => { isMounted = false; };
  }, [adfIds.join(',')]);

  const rows = useMemo(() => {
    return (metrics || []).map((m) => {
      const spent = Math.max(0, m.spent_hours || 0);
      const total = Math.max(0, m.total_hours || 0);
      const pct = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
      return { id: m.id, title: m.title, spent, total, pct };
    });
  }, [metrics]);

  return (
    <>
      <Helmet>
        <title>Progression</title>
      </Helmet>
    <section className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Progression par ADF</h2>
        <p className="text-purple-200">Temps passé / durée totale</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
      >
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
          Vos ADF
        </h3>

        {(adfLoading || loading) && (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        )}
        {error && <div className="text-red-300 text-sm">{error}</div>}
        {!(adfLoading || loading) && !error && adfIds.length === 0 && (
          <div className="text-white/70 text-sm">Aucune ADF trouvée.</div>
        )}

        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.id} className="">
              <div className="flex items-center justify-between mb-1">
                <div className="text-white/90 text-sm">{row.title || `ADF #${row.id}`}</div>
                <div className="text-white/70 text-xs">
                  {row.spent.toFixed(1)}h / {row.total.toFixed(1)}h ({row.pct}%)
                </div>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
    </>
  );
};

export default ProgressSection;