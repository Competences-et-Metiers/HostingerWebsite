import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Award, Target } from 'lucide-react';
import ProgressChart from '@/components/ProgressChart';

const ProgressSection = () => {
  const progressData = [
    { month: 'Jan', skills: 18, goals: 3 },
    { month: 'Fév', skills: 20, goals: 4 },
    { month: 'Mar', skills: 22, goals: 5 },
    { month: 'Avr', skills: 24, goals: 6 },
    { month: 'Mai', skills: 24, goals: 8 },
  ];

  const achievements = [
    {
      title: "Premier objectif atteint",
      description: "Communication publique maîtrisée",
      date: "15 Mars 2024",
      icon: Award,
      color: "from-yellow-500 to-orange-500"
    },
    {
      title: "Nouvelle compétence",
      description: "Analyse de données avancée",
      date: "8 Avril 2024",
      icon: TrendingUp,
      color: "from-blue-500 to-purple-500"
    },
    {
      title: "Certification obtenue",
      description: "Gestion de projet agile",
      date: "22 Avril 2024",
      icon: Target,
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Suivi des Progrès</h2>
        <p className="text-purple-200">Visualisez votre évolution et vos accomplissements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
            Évolution mensuelle
          </h3>
          <ProgressChart data={progressData} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-green-400" />
            Accomplissements récents
          </h3>
          <div className="space-y-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className="flex items-start space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className={`w-10 h-10 bg-gradient-to-r ${achievement.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <achievement.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">{achievement.title}</h4>
                  <p className="text-white/70 text-sm">{achievement.description}</p>
                  <p className="text-purple-300 text-xs mt-1">{achievement.date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProgressSection;