import React, { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import AdfCompetencyCard from '@/components/AdfCompetencyCard';
import { useAdfCompetencies, useAdfIds } from '@/hooks/useDendreoData';
import { Skeleton } from '@/components/ui/skeleton';

const SkillsPages = () => {
  // Get filtered ADF IDs (same approach as ProgressPage)
  const { data: adfData, isLoading: adfLoading } = useAdfIds();
  const allowedAdfIds = Array.isArray(adfData?.adf_ids) ? adfData.adf_ids.map(String) : [];
  const adfTitles = adfData?.adf_titles || {};
  
  const { data, isLoading: competenciesLoading, error: queryError } = useAdfCompetencies();
  const error = queryError?.message || null;
  const loading = adfLoading || competenciesLoading;
  
  // Filter ADFs to only show allowed ones and merge with titles (frontend safety filter)
  const adfs = useMemo(() => {
    const allAdfs = Array.isArray(data?.adfs) ? data.adfs : [];
    
    // If we have a filtered list, only show those ADFs
    if (allowedAdfIds.length > 0) {
      const filtered = allAdfs.filter(adf => 
        allowedAdfIds.includes(String(adf.adf_id))
      );
      
      // Merge ADF titles from get-adf function
      const withTitles = filtered.map(adf => ({
        ...adf,
        title: adfTitles[String(adf.adf_id)] || adf.title || null
      }));
      
      console.log(`[SkillsPages] Filtering: ${allAdfs.length} total ADFs → ${filtered.length} allowed ADFs (${allowedAdfIds.join(', ')})`);
      return withTitles;
    }
    
    // If no filtering, still merge titles
    return allAdfs.map(adf => ({
      ...adf,
      title: adfTitles[String(adf.adf_id)] || adf.title || null
    }));
  }, [data?.adfs, allowedAdfIds, adfTitles]);

  

  return (
    <section className="space-y-8">
      {(() => {
        const { setHeader } = useOutletContext() || {};
        useEffect(() => {
          setHeader && setHeader('Mes Compétences', 'Évaluez et développez vos compétences professionnelles');
        }, [setHeader]);
        return null;
      })()}

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

export default SkillsPages;