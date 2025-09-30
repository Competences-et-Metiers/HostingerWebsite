import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, BookOpen, Award } from 'lucide-react';
import StatsCard from '@/components/StatsCard';

const Dashboard = () => {
  const stats = [
    {
      title: "Compétences évaluées",
      value: "24",
      change: "+3 cette semaine",
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Objectifs en cours",
      value: "8",
      change: "2 complétés récemment",
      icon: Target,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Formations suivies",
      value: "12",
      change: "+1 ce mois",
      icon: BookOpen,
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Certifications",
      value: "5",
      change: "1 en attente",
      icon: Award,
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
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
  );
};

export default Dashboard;