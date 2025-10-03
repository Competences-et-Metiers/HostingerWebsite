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
        const ADF_ID = '129';
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
    fetchHours();
    return () => controller.abort();
  }, []);

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
      </section>
    </>
  );
};

export default Dashboard;