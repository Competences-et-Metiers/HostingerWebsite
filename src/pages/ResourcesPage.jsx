import React, { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdfIds } from '@/hooks/useDendreoData';
import { useResourceGroups } from '@/hooks/useResourcesData';

const ResourcesPage = () => {
  // Use cached hooks
  const { data: adfData, isLoading: adfLoading } = useAdfIds();
  const { groups, isLoading: filesLoading, error } = useResourceGroups(adfData);
  
  const loading = adfLoading || filesLoading;
  
  // Show toast if no resources found
  useEffect(() => {
    if (!loading && groups.length === 0 && adfData?.adf_ids?.length > 0) {
      toast({ title: 'Aucune ressource', description: "Aucun fichier partagé n'a été trouvé pour vos formations." });
    }
  }, [loading, groups.length, adfData, toast]);
  
  // Show error toast
  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur de chargement', description: error?.message || 'Une erreur est survenue.' });
    }
  }, [error, toast]);

  const handleOpen = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="space-y-8">
      {(() => {
        const { setHeader } = useOutletContext() || {};
        useEffect(() => {
          setHeader && setHeader('Ressources de votre Bilan', "Fichiers partagés, regroupés par action de formation");
        }, [setHeader]);
        return null;
      })()}

      {groups.length === 0 && !loading && (
        <div className="text-white/70">Aucun fichier partagé disponible pour le moment.</div>
      )}

      {loading && (
        <div className="space-y-8">
          {Array.from({ length: 2 }).map((_, gi) => (
            <div key={gi} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="mb-4">
                <Skeleton className="h-6 w-1/3 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                    <div className="min-w-0 mr-3 w-full">
                      <Skeleton className="h-4 w-2/3 mb-1" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-9 w-24 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-8">
        {groups.map((group, index) => (
          <motion.div
            key={group.adfId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 * index }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{group.title}</h3>
                <div className="text-white/60 text-sm">ADF {group.adfId}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.files.map((file, i) => (
                <div key={`${group.adfId}-${file?.uuid || file?.id || i}`} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                  <div className="min-w-0 mr-3">
                    <div className="text-white truncate">{file?.name || 'Fichier'}</div>
                    <div className="text-white/60 text-xs truncate">{file?.mime_type || ''}</div>
                  </div>
                  <Button
                    onClick={() => handleOpen(file?.public_url)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                    disabled={!file?.public_url}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ResourcesPage;