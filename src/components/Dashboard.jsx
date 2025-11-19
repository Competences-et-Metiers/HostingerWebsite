import React, { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Target, BookOpen, Award } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { Helmet } from 'react-helmet';
import { useAdfIds, useMultipleAdfMetrics, useAdfMetrics } from '@/hooks/useDendreoData';

const Dashboard = () => {
  const [displayedProgress, setDisplayedProgress] = useState(0);
  
  // Use cached hooks
  const { data: adfData } = useAdfIds();
  const adfIds = Array.isArray(adfData?.adf_ids) ? adfData.adf_ids.map(String) : [];
  const { data: allMetrics } = useMultipleAdfMetrics(adfIds);
  
  // Get metrics for first ADF (447) for the main stats
  const { data: mainAdfData } = useAdfMetrics('447');
  const spentHours = mainAdfData?.spent_hours ?? null;
  const remainingHours = mainAdfData?.remaining_hours ?? null;
  const totalHours = mainAdfData?.total_hours ?? null;

  const formatHours = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    const totalMinutes = Math.round(Number(value) * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (m === 0) return `${h} h`;
    if (h === 0) return `${m} min`;
    return `${h} h ${m} min`;
  };

  // Compute average progression across all ADFs (progression globale)
  const globalProgress = useMemo(() => {
    if (!allMetrics || allMetrics.length === 0) return null;
    
    const pcts = allMetrics.map((m) => {
      const spent = Number(m.spent_hours ?? 0) || 0;
      const total = Number(m.total_hours ?? 0) || 0;
      return total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
    });
    
    return pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
  }, [allMetrics]);

  // Animate the visible percentage value when globalProgress updates
  useEffect(() => {
    if (globalProgress === null || typeof globalProgress !== 'number') {
      setDisplayedProgress(0);
      return;
    }
    const to = Math.max(0, Math.min(100, globalProgress));
    const from = Math.max(0, Math.min(100, Number.isFinite(displayedProgress) ? displayedProgress : 0));
    const durationMs = 800;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const val = Math.round(from + (to - from) * eased);
      setDisplayedProgress(val);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [globalProgress]);

  const stats = [
    {
      title: "Heures effectuées",
      value: formatHours(spentHours),
      change: "",
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-500"
    },
    {
      title: "Heures restantes",
      value: formatHours(remainingHours),
      change: "",
      icon: Target,
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Heures totales",
      value: formatHours(totalHours),
      change: "",
      icon: BookOpen,
      color: "from-indigo-500 to-sky-500"
    }
  ];

  return (
    <>
      {(() => {
        const { setHeader } = useOutletContext() || {};
        useEffect(() => {
          setHeader && setHeader('Tableau de Bord', 'Votre progression globale');
        }, [setHeader]);
        return null;
      })()}
      <Helmet>
        <title>Tableau de Bord</title>
      </Helmet>
      <section className="space-y-8">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 * index }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>
      <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-white font-semibold mb-4">Votre progression globale : {globalProgress !== null ? `${displayedProgress}%` : '—'}</h3>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${globalProgress ? displayedProgress : 0}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          />
        </div>
      </div>
      </section>
    </>
  );
};

export default Dashboard;