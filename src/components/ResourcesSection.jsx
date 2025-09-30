import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Video, FileText, ExternalLink, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ResourceCard from '@/components/ResourceCard';

const ResourcesSection = () => {
  const [resources] = useState([
    {
      id: 1,
      title: "Guide complet du leadership",
      description: "Développez vos compétences de leadership avec ce guide pratique",
      type: "guide",
      category: "Management",
      duration: "2h de lecture",
      level: "Intermédiaire",
      icon: FileText
    },
    {
      id: 2,
      title: "Formation en ligne : Communication efficace",
      description: "Cours vidéo interactif pour améliorer vos compétences de communication",
      type: "video",
      category: "Soft Skills",
      duration: "4h de vidéo",
      level: "Débutant",
      icon: Video
    },
    {
      id: 3,
      title: "Méthodologies de gestion de projet",
      description: "Apprenez les meilleures pratiques en gestion de projet",
      type: "cours",
      category: "Gestion",
      duration: "6h de formation",
      level: "Avancé",
      icon: BookOpen
    },
    {
      id: 4,
      title: "Outils d'analyse de données",
      description: "Maîtrisez les outils modernes d'analyse et de visualisation",
      type: "guide",
      category: "Technique",
      duration: "3h de lecture",
      level: "Intermédiaire",
      icon: FileText
    }
  ]);

  const handleSearch = () => {
    toast({
      title: "Recherche de ressources",
      description: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀"
    });
  };

  const handleViewAll = () => {
    toast({
      title: "Voir toutes les ressources",
      description: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀"
    });
  };

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Ressources de Formation</h2>
          <p className="text-purple-200">Accédez à des ressources pour développer vos compétences</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleSearch}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Search className="h-4 w-4 mr-2" />
            Rechercher
          </Button>
          <Button
            onClick={handleViewAll}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir tout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resources.map((resource, index) => (
          <motion.div
            key={resource.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 * index }}
          >
            <ResourceCard resource={resource} />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ResourcesSection;