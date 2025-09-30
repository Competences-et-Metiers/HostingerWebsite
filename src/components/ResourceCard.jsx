import React from 'react';
import { motion } from 'framer-motion';
import { Clock, BarChart3, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const ResourceCard = ({ resource }) => {
  const handleAccess = () => {
    toast({
      title: "Accéder à la ressource",
      description: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀"
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'video': return 'from-red-500 to-pink-500';
      case 'cours': return 'from-blue-500 to-cyan-500';
      case 'guide': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Débutant': return 'text-green-400 bg-green-500/20';
      case 'Intermédiaire': return 'text-yellow-400 bg-yellow-500/20';
      case 'Avancé': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.2 }}
      className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-white/30"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${getTypeColor(resource.type)} rounded-lg flex items-center justify-center`}>
          <resource.icon className="h-6 w-6 text-white" />
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(resource.level)}`}>
          {resource.level}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">{resource.title}</h3>
          <span className="text-purple-300 text-sm bg-purple-500/20 px-2 py-1 rounded-full">
            {resource.category}
          </span>
        </div>

        <p className="text-white/80 text-sm">{resource.description}</p>

        <div className="flex items-center space-x-4 text-sm text-white/60">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{resource.duration}</span>
          </div>
          <div className="flex items-center space-x-1">
            <BarChart3 className="h-4 w-4" />
            <span>{resource.level}</span>
          </div>
        </div>

        <Button
          onClick={handleAccess}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Accéder à la ressource
        </Button>
      </div>
    </motion.div>
  );
};

export default ResourceCard;