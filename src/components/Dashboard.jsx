import React, { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Target, BookOpen, Award, Calendar as CalendarIcon, Clock, FileSignature, Copy, ExternalLink } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { Helmet } from 'react-helmet';
import { useAdfIds, useMultipleAdfMetrics, useAdfMetrics } from '@/hooks/useDendreoData';
import { useCalendarSessions } from '@/hooks/useCalendarData';
import { useParticipantTaches } from '@/hooks/useTachesData';
import { useToast } from '@/components/ui/use-toast';

const Dashboard = () => {
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [selectedSession, setSelectedSession] = useState(null);
  const { toast } = useToast();
  
  // Use cached hooks
  const { data: adfData } = useAdfIds();
  const adfIds = Array.isArray(adfData?.adf_ids) ? adfData.adf_ids.map(String) : [];
  const participantId = adfData?.id_participant;
  const extranetCode = adfData?.extranet_code_numeric || 
    (adfData?.extranet_code ? String(adfData.extranet_code).replace(/[^0-9]/g, '') : null);
  const { data: allMetrics } = useMultipleAdfMetrics(adfIds);
  
  // Fetch calendar sessions with caching
  const { data: sessions = [] } = useCalendarSessions(participantId, adfIds);
  
  // Fetch participant tasks (e-signatures, etc.)
  const { data: tachesData } = useParticipantTaches(participantId);
  
  // Extract e-signatures
  const pendingEsignatures = useMemo(() => {
    if (!tachesData?.taches) return [];
    return tachesData.taches
      .filter(t => t.type === 'esignature')
      .sort((a, b) => {
        const dateA = new Date(a.creneau_date_debut).getTime();
        const dateB = new Date(b.creneau_date_debut).getTime();
        return dateA - dateB;
      });
  }, [tachesData]);
  
  // Get metrics for first ADF (447) for the main stats
  const { data: mainAdfData } = useAdfMetrics('447');
  const spentHours = mainAdfData?.spent_hours ?? null;
  const remainingHours = mainAdfData?.remaining_hours ?? null;
  const totalHours = mainAdfData?.total_hours ?? null;

  const formatHours = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    const totalMinutes = Math.round(Number(value) * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (m === 0) return `${h} h`;
    if (h === 0) return `${m} min`;
    return `${h} h ${m} min`;
  };

  // Compute average progression across all ADFs (progression globale)
  const globalProgress = useMemo(() => {
    if (!allMetrics || allMetrics.length === 0) return null;
    
    const pcts = allMetrics.map((m) => {
      const spent = Number(m.spent_hours ?? 0) || 0;
      const total = Number(m.total_hours ?? 0) || 0;
      return total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
    });
    
    return pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
  }, [allMetrics]);

  // Parse Dendreo date format: "YYYY-MM-DD HH:mm:ss"
  const parseDendreoDate = (value) => {
    if (!value) return null;
    return new Date(String(value).replace(' ', 'T'));
  };

  // Color palette for different ADFs - matches CalendarPage
  const ADF_COLORS = [
    { bg: 'bg-blue-500/60', border: 'border-blue-500/70' },
    { bg: 'bg-purple-500/60', border: 'border-purple-500/70' },
    { bg: 'bg-emerald-500/60', border: 'border-emerald-500/70' },
    { bg: 'bg-orange-500/60', border: 'border-orange-500/70' },
    { bg: 'bg-pink-500/60', border: 'border-pink-500/70' },
    { bg: 'bg-teal-500/60', border: 'border-teal-500/70' },
    { bg: 'bg-indigo-500/60', border: 'border-indigo-500/70' },
    { bg: 'bg-rose-500/60', border: 'border-rose-500/70' },
  ];

  // Map ADF IDs to colors consistently
  const adfColorMap = useMemo(() => {
    const map = new Map();
    const uniqueAdfIds = [...new Set(sessions.map(s => s.id_action_de_formation))].sort();
    uniqueAdfIds.forEach((adfId, index) => {
      map.set(String(adfId), ADF_COLORS[index % ADF_COLORS.length]);
    });
    return map;
  }, [sessions]);

  // Get color for an ADF
  const getAdfColor = (adfId) => {
    return adfColorMap.get(String(adfId)) || ADF_COLORS[0];
  };

  // Handle copy to clipboard with fallback
  const handleCopyCode = async () => {
    if (!extranetCode) return;
    
    const textToCopy = String(extranetCode);
    
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        toast({
          title: "Code copié !",
          description: "Le code d'accès a été copié dans le presse-papier.",
        });
        return;
      } catch (err) {
        console.error('Clipboard API failed:', err);
      }
    }
    
    // Fallback to execCommand
    try {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast({
          title: "Code copié !",
          description: "Le code d'accès a été copié dans le presse-papier.",
        });
      } else {
        throw new Error('execCommand failed');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      toast({
        variant: "destructive",
        title: "Erreur de copie",
        description: "Impossible de copier automatiquement. Sélectionnez le code pour le copier manuellement.",
      });
    }
  };

  // Get 3 closest upcoming sessions
  const upcomingSessions = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];
    
    const now = new Date();
    const upcoming = sessions
      .map(session => ({
        ...session,
        startDate: parseDendreoDate(session.date_debut),
        endDate: parseDendreoDate(session.date_fin)
      }))
      .filter(session => session.startDate && session.startDate >= now)
      .sort((a, b) => a.startDate - b.startDate)
      .slice(0, 3);
    
    return upcoming;
  }, [sessions]);

  // Format date for display
  const formatSessionDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatSessionTime = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    const fmt = { hour: '2-digit', minute: '2-digit' };
    return `${startDate.toLocaleTimeString('fr-FR', fmt)} - ${endDate.toLocaleTimeString('fr-FR', fmt)}`;
  };

  // Animate the visible percentage value when globalProgress updates
  useEffect(() => {
    if (globalProgress === null || typeof globalProgress !== 'number') {
      setDisplayedProgress(0);
      return;
    }
    const to = Math.max(0, Math.min(100, globalProgress));
    const from = Math.max(0, Math.min(100, Number.isFinite(displayedProgress) ? displayedProgress : 0));
    const durationMs = 800;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const val = Math.round(from + (to - from) * eased);
      setDisplayedProgress(val);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [globalProgress]);

  const stats = [
    {
      title: "Heures effectuées",
      value: formatHours(spentHours),
      change: "",
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-500"
    },
    {
      title: "Heures restantes",
      value: formatHours(remainingHours),
      change: "",
      icon: Target,
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Heures totales",
      value: formatHours(totalHours),
      change: "",
      icon: BookOpen,
      color: "from-indigo-500 to-sky-500"
    }
  ];

  return (
    <>
      {(() => {
        const { setHeader } = useOutletContext() || {};
        useEffect(() => {
          setHeader && setHeader('Tableau de Bord', 'Votre progression globale');
        }, [setHeader]);
        return null;
      })()}
      <Helmet>
        <title>Tableau de Bord</title>
      </Helmet>
      <section className="space-y-8">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 * index }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>
      <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-white font-semibold mb-4">Votre progression globale : {globalProgress !== null ? `${displayedProgress}%` : '—'}</h3>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${globalProgress ? displayedProgress : 0}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          />
        </div>
      </div>

      {/* Pending E-signatures Section */}
      {pendingEsignatures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-xl border-2 border-yellow-500/50 p-6 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-yellow-500/30 rounded-lg">
              <FileSignature className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-white font-bold text-2xl">Vos émargements en attente</h3>
              <p className="text-yellow-200/80 text-sm">
                {pendingEsignatures.length} signature{pendingEsignatures.length > 1 ? 's' : ''} électronique{pendingEsignatures.length > 1 ? 's' : ''} à compléter
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            {pendingEsignatures.map((esignature, index) => {
              const startDate = new Date(esignature.creneau_date_debut);
              const endDate = new Date(esignature.creneau_date_fin);
              
              return (
                <motion.div
                  key={`${esignature.id_adf}-${esignature.id_lcp}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/30 hover:border-yellow-400/60 transition-all hover:bg-white/15"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-base mb-2">
                        {esignature.intitule || 'Émargement électronique'}
                      </h4>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-white/90 text-sm">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          <span>{startDate.toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'short',
                            year: 'numeric'
                          })}</span>
                        </div>
                        
                        <span className="hidden sm:inline text-white/40">•</span>
                        
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={esignature.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-5 py-2.5 text-sm transition-all hover:scale-105 hover:shadow-lg whitespace-nowrap"
                    >
                      <FileSignature className="w-4 h-4" />
                      Signer maintenant
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Upcoming Sessions Section */}
      <div className="mt-8">
        <h3 className="text-white font-semibold text-xl mb-4 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Prochaines sessions
        </h3>
        
        {upcomingSessions.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <p className="text-white/70 text-center">Aucune session à venir pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingSessions.map((session, index) => {
              const adfColors = getAdfColor(session.id_action_de_formation);
              return (
                <motion.div
                  key={`${session.id_action_de_formation}-${session.id_creneau}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all hover:shadow-xl relative`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-white font-bold text-lg flex-1">
                      {session.name || 'Session'}
                    </h4>
                    <div className="flex-shrink-0 ml-2">
                      {session.lcps?.[0]?.presence === '1' && (
                        <div className="w-3 h-3 rounded-full bg-green-400 border border-white" title="Présence confirmée" />
                      )}
                      {session.lcps?.[0]?.presence === '2' && (
                        <div className="w-3 h-3 rounded-full bg-red-400 border border-white" title="Absence" />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2.5 mb-5">
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="capitalize">{formatSessionDate(session.startDate)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{formatSessionTime(session.startDate, session.endDate)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedSession(session)}
                    className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-4 py-3 text-sm transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Rejoindre la réunion
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Join Dialog */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSession(null);
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-[90vw] max-w-md p-6"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-white font-bold text-xl">{selectedSession.name || 'Session'}</div>
                <div className="text-purple-200 text-sm mt-1">
                  {formatSessionTime(selectedSession.startDate, selectedSession.endDate)}
                </div>
              </div>
              <button
                className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                onClick={() => setSelectedSession(null)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {extranetCode && (
                <div className="rounded-xl bg-white/5 border border-white/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-purple-200 text-xs mb-2 font-medium">Votre code d'accès à 9 chiffres</div>
                      <div className="text-white font-mono tracking-wider text-xl font-bold select-all">{extranetCode}</div>
                    </div>
                    <button
                      type="button"
                      className="text-white/70 hover:text-white p-2.5 rounded-lg hover:bg-white/10 transition-colors ml-3"
                      onClick={handleCopyCode}
                      aria-label="Copier le code"
                      title="Copier le code"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              <a
                href={selectedSession.url_connexion || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-3.5 text-base font-bold transition-all hover:scale-105 hover:shadow-lg"
                onClick={() => setSelectedSession(null)}
              >
                <ExternalLink className="w-5 h-5" />
                Rejoindre la réunion
              </a>
            </div>
          </motion.div>
        </div>
      )}
      </section>
    </>
  );
};

export default Dashboard;