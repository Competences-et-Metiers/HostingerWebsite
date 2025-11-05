import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase, supabaseUrl } from '@/lib/customSupabaseClient';
import { Skeleton } from '@/components/ui/skeleton';

const functionsBase = `${supabaseUrl}/functions/v1`;



const ResourcesPage = () => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]); // [{ adfId, title, files: [] }]

  const fetchResources = useMemo(() => async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};

      const resAdf = await fetch(`${functionsBase}/get-adf`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...authHeader },
      });
      if (!resAdf.ok) {
        const errBody = await resAdf.json().catch(() => ({}));
        throw new Error(errBody?.error || `get-adf failed (${resAdf.status})`);
      }
      const adfPayload = await resAdf.json();
      const adfIds = Array.isArray(adfPayload?.adf_ids) ? adfPayload.adf_ids : [];
      const lapIds = Array.isArray(adfPayload?.lap_ids) ? adfPayload.lap_ids : [];
      const adfToLapIds = adfPayload?.adf_to_lap_ids || {};
      const adfTitles = adfPayload?.adf_titles || {};

      if (lapIds.length === 0 || adfIds.length === 0) {
        setGroups([]);
        toast({ title: 'Aucune ressource', description: "Aucun fichier partagé n'a été trouvé pour vos formations." });
        return;
      }

      const resFiles = await fetch(`${functionsBase}/lap-files?lap_ids=${encodeURIComponent(lapIds.join(','))}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...authHeader },
      });
      if (!resFiles.ok) {
        const errBody = await resFiles.json().catch(() => ({}));
        throw new Error(errBody?.error || `lap-files failed (${resFiles.status})`);
      }
      const filesPayload = await resFiles.json();
      const perLap = filesPayload?.per_lap || {};

      const buildFilesFromLap = (lapBody) => {
        if (!lapBody) return [];
        if (Array.isArray(lapBody)) return lapBody;
        if (typeof lapBody === 'object') {
          const inner = lapBody?.fichiers;
          return Array.isArray(inner) ? inner : [];
        }
        return [];
      };

      const builtGroups = adfIds.map((adfId) => {
        const lapList = Array.isArray(adfToLapIds[adfId]) ? adfToLapIds[adfId] : [];
        const files = [];
        for (const lapId of lapList) {
          const lapBody = perLap?.[lapId];
          const lapFiles = buildFilesFromLap(lapBody);
          for (const f of lapFiles) files.push(f);
        }
        return { adfId, title: adfTitles?.[adfId] || `Formation ${adfId}`, files };
      }).filter(g => g.files.length > 0);

      setGroups(builtGroups);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur de chargement', description: e?.message || 'Une erreur est survenue.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

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