import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import AdfCompetencyCard from '@/components/AdfCompetencyCard';
import { fetchAdfCompetencies } from '@/lib/dendreo';
import { Skeleton } from '@/components/ui/skeleton';

const SkillsSection = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adfs, setAdfs] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAdfCompetencies();
        if (!mounted) return;
        setAdfs(Array.isArray(data?.adfs) ? data.adfs : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Impossible de charger les compétences');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  

  return (
    <section className="space-y-8">
      {(() => {
        const { setHeader } = useOutletContext() || {};
        useEffect(() => {
          setHeader && setHeader('Mes Compétences', 'Évaluez et développez vos compétences professionnelles');
        }, [setHeader]);
        return null;
      })()}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-start justify-between mb-4">
                <div className="w-full">
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-red-300">{error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adfs.map((adf, index) => (
            <motion.div
              key={adf.adf_id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.05 * index }}
            >
              <AdfCompetencyCard adf={adf} />
            </motion.div>
          ))}
          {!loading && adfs.length === 0 && (
            <></>
          )}
        </div>
      )}
    </section>
  );
};

export default SkillsSection;