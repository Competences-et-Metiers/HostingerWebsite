import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import SkillCard from '@/components/SkillCard';

const SkillsSection = () => {
  const [skills] = useState([
    {
      id: 1,
      name: "Communication",
      category: "Soft Skills",
      level: 4,
      progress: 80,
      description: "Capacité à communiquer efficacement avec les équipes"
    },
    {
      id: 2,
      name: "Gestion de projet",
      category: "Management",
      level: 3,
      progress: 65,
      description: "Planification et suivi de projets complexes"
    },
    {
      id: 3,
      name: "Analyse de données",
      category: "Technique",
      level: 3,
      progress: 70,
      description: "Traitement et interprétation de données"
    },
    {
      id: 4,
      name: "Leadership",
      category: "Management",
      level: 2,
      progress: 45,
      description: "Capacité à diriger et motiver une équipe"
    }
  ]);

  const handleAddSkill = () => {
    toast({
      title: "Ajouter une compétence",
      description: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀"
    });
  };

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Mes Compétences</h2>
          <p className="text-purple-200">Évaluez et développez vos compétences professionnelles</p>
        </div>
        <Button
          onClick={handleAddSkill}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skills.map((skill, index) => (
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 * index }}
          >
            <SkillCard skill={skill} />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default SkillsSection;