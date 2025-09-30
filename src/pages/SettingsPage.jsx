import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const SettingsPage = () => {
  const { toast } = useToast();

  const showToast = () => {
    toast({
      title: "Action non implémentée",
      description: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀",
    });
  };

  return (
    <>
      <Helmet>
        <title>Paramètres - Plateforme Bilan de Compétences</title>
        <meta name="description" content="Gérez les paramètres de votre compte." />
      </Helmet>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8 max-w-2xl mx-auto"
      >
        <h2 className="text-3xl font-bold text-white mb-2">Paramètres</h2>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">Notifications par email</h3>
              <p className="text-sm text-purple-200">Recevoir les rappels et les mises à jour par email.</p>
            </div>
            <Button onClick={showToast}>Activer</Button>
          </div>
        </div>
      </motion.section>
    </>
  );
};

export default SettingsPage;