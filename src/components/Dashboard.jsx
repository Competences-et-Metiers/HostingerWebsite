import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, BookOpen, Award } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { Helmet } from 'react-helmet';
import { supabaseUrl, supabaseAnonKey, supabase } from '@/lib/customSupabaseClient';

const Dashboard = () => {
  const [spentHours, setSpentHours] = useState(null);
  const [remainingHours, setRemainingHours] = useState(null);
  const [totalHours, setTotalHours] = useState(null);
  const [adfIds, setAdfIds] = useState([]);
  const [globalProgress, setGlobalProgress] = useState(null);
  const [displayedProgress, setDisplayedProgress] = useState(0);

  const formatHours = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    const totalMinutes = Math.round(Number(value) * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (m === 0) return `${h} h`;
    if (h === 0) return `${m} min`;
    return `${h} h ${m} min`;
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchHours = async () => {
      try {
        const ADF_ID = '447';
        const functionsBase = supabaseUrl.replace('supabase.co', 'functions.supabase.co');
        const url = `${functionsBase}/test?id=${encodeURIComponent(ADF_ID)}`;
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
          },
          signal: controller.signal
        });
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (typeof data?.spent_hours === 'number') setSpentHours(Number(data.spent_hours));
        if (typeof data?.remaining_hours === 'number') setRemainingHours(Number(data.remaining_hours));
        if (typeof data?.total_hours === 'number') setTotalHours(Number(data.total_hours));
      } catch (_) {
        // swallow
      }
    };
    const fetchAdfs = async () => {
      try {
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
          headers: {
            apikey: supabaseAnonKey,
            Authorization: authHeader
          },
          signal: controller.signal
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data?.adf_ids)) {
          setAdfIds(data.adf_ids.map((v) => String(v)));
        }
      } catch (_) {
        // swallow
      }
    };
    fetchHours();
    fetchAdfs();
    return () => controller.abort();
  }, []);

  // Compute average progression across all ADFs (progression globale)
  useEffect(() => {
    let isMounted = true;
    const computeGlobalProgress = async () => {
      if (!adfIds || adfIds.length === 0) {
        if (isMounted) setGlobalProgress(null);
        return;
      }
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
              headers: { apikey: supabaseAnonKey, Authorization: authHeader }
            });
            if (!res.ok) throw new Error(`test ${res.status}`);
            const payload = await res.json();
            const spent = Number(payload.spent_hours ?? 0) || 0;
            const total = Number(payload.total_hours ?? 0) || 0;
            const pct = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
            return pct;
          })
        );
        if (!isMounted) return;
        const pcts = results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value);
        const avg = pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
        setGlobalProgress(avg);
      } catch (_) {
        if (isMounted) setGlobalProgress(null);
      }
    };
    computeGlobalProgress();
    return () => { isMounted = false; };
  }, [adfIds.join(',')]);

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
      <Helmet>
        <title>Tableau de Bord</title>
      </Helmet>
      <section className="space-y-8">
      <div className="text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-white mb-4"
        >
          Tableau de Bord
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-purple-200 text-lg max-w-2xl mx-auto"
        >
          Suivez votre progression et développez vos compétences professionnelles
        </motion.p>
      </div>

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