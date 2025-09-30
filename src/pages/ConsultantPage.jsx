import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Mail, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const ConsultantPage = () => {
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
        <title>Mon Consultant - Plateforme Bilan de Compétences</title>
        <meta name="description" content="Informations sur votre consultant." />
      </Helmet>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <h2 className="text-3xl font-bold text-white mb-2">Mon Consultant</h2>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 flex flex-col md:flex-row items-center gap-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <img
              className="w-40 h-40 rounded-full object-cover border-4 border-purple-500 shadow-lg"
              alt="Photo de profil du consultant"
             src="https://images.unsplash.com/photo-1603991414220-51b87b89a371" />
          </motion.div>
          
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white">Alexandre Dubois</h3>
            <p className="text-purple-200">Consultant en évolution professionnelle</p>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-center md:justify-start gap-3 text-white/80">
                <Mail className="w-5 h-5 text-purple-300" />
                <span>alexandre.dubois@consultant.com</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3 text-white/80">
                <Phone className="w-5 h-5 text-purple-300" />
                <span>06 12 34 56 78</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center md:justify-start">
              <Button onClick={showToast} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 text-base">
                <Calendar className="w-5 h-5 mr-2" />
                Prendre rendez-vous
              </Button>
            </div>
          </div>
        </div>
      </motion.section>
    </>
  );
};

export default ConsultantPage;