import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const SkillCard = ({ skill }) => {
  const handleImprove = () => {
    toast({
      title: "Améliorer la compétence",
      description: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀"
    });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-white/30"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">{skill.name}</h3>
          <span className="text-purple-300 text-sm bg-purple-500/20 px-2 py-1 rounded-full">
            {skill.category}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < skill.level ? 'text-yellow-400 fill-current' : 'text-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      <p className="text-white/80 text-sm mb-4">{skill.description}</p>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/80">Progression</span>
          <span className="text-white font-medium">{skill.progress}%</span>
        </div>
        
        <div className="w-full bg-white/20 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${skill.progress}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
          />
        </div>

        <Button
          onClick={handleImprove}
          variant="ghost"
          size="sm"
          className="w-full text-purple-300 hover:text-white hover:bg-purple-500/20"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Améliorer cette compétence
        </Button>
      </div>
    </motion.div>
  );
};

export default SkillCard;