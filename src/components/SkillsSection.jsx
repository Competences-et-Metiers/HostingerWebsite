import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import AdfCompetencyCard from '@/components/AdfCompetencyCard';
import { fetchAdfCompetencies } from '@/lib/dendreo';
import { Skeleton } from '@/components/ui/skeleton';

const SkillsSection = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adfs, setAdfs] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAdfCompetencies();
        if (!mounted) return;
        setAdfs(Array.isArray(data?.adfs) ? data.adfs : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Impossible de charger les compétences');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-start justify-between mb-4">
                <div className="w-full">
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-red-300">{error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adfs.map((adf, index) => (
            <motion.div
              key={adf.adf_id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.05 * index }}
            >
              <AdfCompetencyCard adf={adf} />
            </motion.div>
          ))}
          {!loading && adfs.length === 0 && (
            <></>
          )}
        </div>
      )}
    </section>
  );
};

export default SkillsSection;