import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flag, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const GoalCard = ({ goal }) => {
  const handleUpdateProgress = () => {
    toast({
      title: "Mettre à jour la progression",
      description: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀"
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'haute': return 'from-red-500 to-orange-500';
      case 'moyenne': return 'from-yellow-500 to-orange-500';
      case 'basse': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'termine': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'en_cours': return <Clock className="h-5 w-5 text-blue-400" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-white/30 ${
        goal.status === 'termine' ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon(goal.status)}
          <div>
            <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-3 h-3 bg-gradient-to-r ${getPriorityColor(goal.priority)} rounded-full`} />
              <span className="text-purple-300 text-sm capitalize">{goal.priority} priorité</span>
            </div>
          </div>
        </div>
        <Flag className={`h-5 w-5 ${goal.priority === 'haute' ? 'text-red-400' : 'text-gray-400'}`} />
      </div>

      <p className="text-white/80 text-sm mb-4">{goal.description}</p>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/80 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Échéance: {formatDate(goal.deadline)}
          </span>
          <span className="text-white font-medium">{goal.progress}%</span>
        </div>
        
        <div className="w-full bg-white/20 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className={`h-2 rounded-full ${
              goal.status === 'termine' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}
          />
        </div>

        {goal.status !== 'termine' && (
          <Button
            onClick={handleUpdateProgress}
            variant="ghost"
            size="sm"
            className="w-full text-blue-300 hover:text-white hover:bg-blue-500/20"
          >
            Mettre à jour la progression
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default GoalCard;