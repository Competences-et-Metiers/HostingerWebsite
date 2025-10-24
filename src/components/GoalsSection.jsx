import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Target, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import GoalCard from '@/components/GoalCard';

const GoalsSection = () => {
  const [goals] = useState([
    {
      id: 1,
      title: "Obtenir une certification en gestion de projet",
      description: "Passer la certification PMP pour valider mes compétences",
      deadline: "2024-06-15",
      progress: 75,
      status: "en_cours",
      priority: "haute"
    },
    {
      id: 2,
      title: "Développer mes compétences en leadership",
      description: "Suivre une formation et encadrer une équipe",
      deadline: "2024-08-30",
      progress: 40,
      status: "en_cours",
      priority: "moyenne"
    },
    {
      id: 3,
      title: "Maîtriser l'analyse de données",
      description: "Apprendre les outils d'analyse et de visualisation",
      deadline: "2024-05-20",
      progress: 90,
      status: "en_cours",
      priority: "haute"
    },
    {
      id: 4,
      title: "Améliorer ma communication publique",
      description: "Participer à des conférences et formations",
      deadline: "2024-04-10",
      progress: 100,
      status: "termine",
      priority: "moyenne"
    }
  ]);

  const handleAddGoal = () => {
    toast({
      title: "Ajouter un objectif",
      description: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀"
    });
  };

  const activeGoals = goals.filter(goal => goal.status !== 'termine');
  const completedGoals = goals.filter(goal => goal.status === 'termine');

  return (
    <section className="space-y-8">
      {(() => {
        const { setHeader } = useOutletContext() || {};
        useEffect(() => {
          setHeader && setHeader('Mes Objectifs', 'Définissez et suivez vos objectifs de développement');
        }, [setHeader]);
        return null;
      })()}

      <div className="flex items-center justify-between">
        <div />
        <Button
          onClick={handleAddGoal}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvel objectif
        </Button>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-green-400" />
            Objectifs en cours ({activeGoals.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeGoals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <GoalCard goal={goal} />
              </motion.div>
            ))}
          </div>
        </div>

        {completedGoals.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
              Objectifs terminés ({completedGoals.length})
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {completedGoals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <GoalCard goal={goal} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default GoalsSection;