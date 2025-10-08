import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const CalendarPage = () => {
  const { loading: authLoading } = useAuth();
  const [adfIds, setAdfIds] = useState([]);
  const [adfError, setAdfError] = useState(null);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // currently selected session for popover
  const popoverRef = useRef(null);

  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long' });
  const year = currentDate.getFullYear();

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const today = new Date();

  const parseDendreoDate = (value) => {
    if (!value) return null;
    // Dendreo style: "YYYY-MM-DD HH:mm:ss" -> ensure ISO-like with 'T'
    return new Date(String(value).replace(' ', 'T'));
  };

  // Load ADF IDs from get-adf function (requires authenticated user)
  useEffect(() => {
    let isMounted = true;
    const loadAdfIds = async () => {
      if (authLoading) return; // wait for auth readiness
      setAdfError(null);
      try {
        const { data, error } = await supabase.functions.invoke('get-adf', { method: 'GET' });
        if (error) throw error;
        const ids = Array.isArray(data?.adf_ids) ? data.adf_ids.map(String) : [];
        if (isMounted) setAdfIds(ids);
      } catch (err) {
        if (isMounted) setAdfError(err?.message || 'Erreur lors de la récupération des ADF');
      }
    };
    loadAdfIds();
    return () => { isMounted = false; };
  }, [authLoading]);

  useEffect(() => {
    let isMounted = true;
    const fetchSessions = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke('calendar', {
          body: { adfIds },
        });
        if (error) throw error;
        if (!isMounted) return;
        // Expecting array; if wrapped, try to unwrap
        const result = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        setSessions(result);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || 'Erreur lors du chargement du calendrier');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (adfIds && adfIds.length > 0) {
      fetchSessions();
    } else {
      // if no ADFs, clear sessions
      setSessions([]);
    }
    return () => { isMounted = false; };
  }, [adfIds.join(',')]);

  const sessionsByDay = useMemo(() => {
    const map = new Map();
    for (const session of sessions || []) {
      const start = parseDendreoDate(session.date_debut);
      if (!start) continue;
      if (start.getMonth() !== currentDate.getMonth() || start.getFullYear() !== currentDate.getFullYear()) continue;
      const day = start.getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(session);
    }
    // Sort sessions for each day by start time to better visualize overlaps
    for (const [day, list] of map.entries()) {
      list.sort((a, b) => {
        const sa = parseDendreoDate(a.date_debut)?.getTime() ?? 0;
        const sb = parseDendreoDate(b.date_debut)?.getTime() ?? 0;
        return sa - sb;
      });
      map.set(day, list);
    }
    return map;
  }, [sessions, currentDate]);

  const nextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const presenceColor = (presence) => {
    if (presence === '1') return 'bg-green-500/60 text-white';
    if (presence === '2') return 'bg-red-500/60 text-white';
    if (presence === '' || presence === null || presence === undefined) return 'bg-blue-500/50 text-white';
    return 'bg-gray-500/50 text-white';
  };

  const timeRange = (startStr, endStr) => {
    const start = parseDendreoDate(startStr);
    const end = parseDendreoDate(endStr);
    if (!start || !end) return '';
    const fmt = { hour: '2-digit', minute: '2-digit' };
    return `${start.toLocaleTimeString('fr-FR', fmt)}–${end.toLocaleTimeString('fr-FR', fmt)}`;
  };

  const calendarDays = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`empty-${i}`} className="border border-white/10"></div>);

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const isToday = isSameDay(cellDate, today);
    const daySessions = sessionsByDay.get(day) || [];
    calendarDays.push(
      <div key={day} className={`p-2 border border-white/10 flex flex-col gap-1 relative ${isToday ? 'bg-purple-500/30' : ''}`}>
        <span className={`font-semibold ${isToday ? 'text-purple-300' : 'text-white'}`}>{day}</span>
        {daySessions.map((s) => (
          <button
            key={s.id_creneau}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelected({ session: s, anchorDay: day });
            }}
            className={`mt-1 text-left text-[11px] md:text-xs p-1 rounded ${presenceColor(s?.lcps?.[0]?.presence)} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40`}
          >
            <div className="font-medium truncate">{s.name || 'Session'}</div>
            <div className="opacity-90">{timeRange(s.date_debut, s.date_fin)}</div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Calendrier - Plateforme Bilan de Compétences</title>
        <meta name="description" content="Consultez votre calendrier d'événements et de sessions." />
      </Helmet>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <h2 className="text-3xl font-bold text-white mb-2">Calendrier</h2>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <Button onClick={prevMonth} variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ChevronLeft />
            </Button>
            <h3 className="text-xl font-semibold text-white capitalize">{monthName} {year}</h3>
            <Button onClick={nextMonth} variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ChevronRight />
            </Button>
          </div>
          {loading && <div className="text-white/70 mb-2 text-sm">Chargement des sessions…</div>}
          {error && <div className="text-red-300 mb-2 text-sm">{error}</div>}
          <div className="grid grid-cols-7 text-center text-white/70 mb-2">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 h-[60vh]">
            {calendarDays}
          </div>
          {(adfError || (!loading && adfIds.length === 0)) && (
            <div className="text-white/60 text-sm mt-2">
              {adfError ? adfError : "Aucune ADF trouvée pour l'utilisateur."}
            </div>
          )}
        </div>
        {selected && (
          <div
            ref={popoverRef}
            className="fixed inset-0 z-50"
            onClick={(e) => {
              // close on background click
              if (e.target === e.currentTarget) setSelected(null);
            }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-900 border border-white/20 rounded-lg shadow-xl w-[90vw] max-w-md p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-white font-semibold text-base">{selected.session?.name || 'Session'}</div>
                  <div className="text-white/70 text-sm mt-1">{timeRange(selected.session?.date_debut, selected.session?.date_fin)}</div>
                </div>
                <button
                  className="text-white/70 hover:text-white"
                  onClick={() => setSelected(null)}
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <a
                  href={selected.session?.url_connexion || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 text-sm font-medium disabled:opacity-60"
                >
                  Rejoindre la réunion
                </a>
                {selected.session?.url_connexion_invite && (
                  <a
                    href={selected.session?.url_connexion_invite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-white px-3 py-2 text-xs"
                  >
                    Lien invité
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.section>
    </>
  );
};

export default CalendarPage;