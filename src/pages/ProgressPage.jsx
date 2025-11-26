import React, { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdfIds, useMultipleAdfMetrics } from '@/hooks/useDendreoData';
import ErrorState from '@/components/ErrorState';
import { useQueryClient } from '@tanstack/react-query';

const ProgressPage = () => {
  const queryClient = useQueryClient();
  
  // Fetch ADF IDs with caching
  const { data: adfData, isLoading: adfLoading, error: adfError } = useAdfIds();
  const adfIds = Array.isArray(adfData?.adf_ids) ? adfData.adf_ids.map(String) : [];
  const adfTitles = adfData?.adf_titles || {};
  
  // Fetch metrics for all ADFs with caching
  const { data: metrics, isLoading: loading, isError } = useMultipleAdfMetrics(adfIds);
  const error = adfError || (isError ? new Error('Erreur lors du chargement des métriques') : null);
  
  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['adf-ids'] });
    queryClient.invalidateQueries({ queryKey: ['adf-metrics'] });
  };

  const rows = useMemo(() => {
    return (metrics || []).map((m) => {
      const spent = Math.max(0, m.spent_hours || 0);
      const total = Math.max(0, m.total_hours || 0);
      const pct = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
      // Use title from metrics, fallback to adf_titles from get-adf
      const title = m.title || adfTitles[String(m.id)] || null;
      return { id: m.id, title, spent, total, pct };
    });
  }, [metrics, adfTitles]);

  return (
    <>
      <Helmet>
        <title>Progression</title>
      </Helmet>
    <section className="space-y-8">
      {(() => {
        const { setHeader } = useOutletContext() || {};
        useEffect(() => {
          setHeader && setHeader('Progression de votre Bilan', 'Temps passé / durée totale');
        }, [setHeader]);
        return null;
      })()}

      {error ? (
        <ErrorState
          title="Erreur de chargement"
          message={error?.message || "Impossible de charger vos données de progression. Veuillez réessayer."}
          onRetry={handleRetry}
        />
      ) : (
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
          {!(adfLoading || loading) && adfIds.length === 0 && (
            <div className="text-white/70 text-sm">Aucune ADF trouvée.</div>
          )}

          {!(adfLoading || loading) && rows.length > 0 && (
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
          )}
        </motion.div>
      )}
    </section>
    </>
  );
};

export default ProgressPage;