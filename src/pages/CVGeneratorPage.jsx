import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const CVGeneratorPage = () => {
  const { toast } = useToast();

  const showToast = () => {
    toast({
      title: "Fonctionnalité à venir",
      description: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀",
    });
  };

  return (
    <>
      <Helmet>
        <title>Générateur de CV - Plateforme Bilan de Compétences</title>
        <meta name="description" content="Créez un CV professionnel en quelques clics." />
      </Helmet>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8 text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-2">Générateur de CV</h2>
        <p className="text-purple-200 max-w-2xl mx-auto">
          Bientôt disponible : un outil puissant pour transformer vos compétences et expériences en un CV percutant et professionnel.
        </p>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-12 mt-8 max-w-3xl mx-auto">
          <h3 className="text-2xl font-semibold text-white mb-4">Préparez-vous à impressionner !</h3>
          <p className="text-white/80 mb-8">
            Choisissez parmi des modèles modernes, personnalisez le contenu et téléchargez votre CV en PDF, prêt à être envoyé aux recruteurs.
          </p>
          <Button onClick={showToast} size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 text-base">
            Me notifier quand c'est prêt
          </Button>
        </div>
      </motion.section>
    </>
  );
};

export default CVGeneratorPage;