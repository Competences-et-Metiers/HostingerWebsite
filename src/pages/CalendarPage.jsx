import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdfIds } from '@/hooks/useDendreoData';
import { useCalendarSessions } from '@/hooks/useCalendarData';

const CalendarPage = () => {
  // Use cached hooks
  const { data: adfData, isLoading: adfLoading, error: adfError } = useAdfIds();
  const adfIds = Array.isArray(adfData?.adf_ids) ? adfData.adf_ids.map(String) : [];
  const extranetCode = adfData?.extranet_code_numeric || 
    (adfData?.extranet_code ? String(adfData.extranet_code).replace(/[^0-9]/g, '') : null);
  
  const { data: sessions = [], isLoading: loading, error } = useCalendarSessions(adfIds);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState('month'); // 'day' | 'week' | 'month'
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

  const addDays = (date, numDays) => {
    const d = new Date(date);
    d.setDate(d.getDate() + numDays);
    return d;
  };

  const nextByView = () => {
    setCurrentDate((prev) => {
      if (view === 'day') return addDays(prev, 1);
      if (view === 'week') return addDays(prev, 7);
      return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
    });
  };

  const prevByView = () => {
    setCurrentDate((prev) => {
      if (view === 'day') return addDays(prev, -1);
      if (view === 'week') return addDays(prev, -7);
      return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
    });
  };

  const presenceColor = (presence) => {
    if (presence === '1') return 'bg-green-500/60 text-white';
    if (presence === '2') return 'bg-red-500/60 text-white';
    if (presence === '' || presence === null || presence === undefined) return 'bg-blue-500/50 text-white';
    return 'bg-gray-500/50 text-white';
  };

  const presenceBg = (presence) => {
    if (presence === '1') return 'bg-green-500/60';
    if (presence === '2') return 'bg-red-500/60';
    if (presence === '' || presence === null || presence === undefined) return 'bg-blue-500/50';
    return 'bg-gray-500/50';
  };

  const timeRange = (startStr, endStr) => {
    const start = parseDendreoDate(startStr);
    const end = parseDendreoDate(endStr);
    if (!start || !end) return '';
    const fmt = { hour: '2-digit', minute: '2-digit' };
    return `${start.toLocaleTimeString('fr-FR', fmt)}–${end.toLocaleTimeString('fr-FR', fmt)}`;
  };

  const getSessionsForDate = (date) => {
    const result = [];
    for (const session of sessions || []) {
      const start = parseDendreoDate(session.date_debut);
      if (!start) continue;
      if (isSameDay(start, date)) result.push(session);
    }
    result.sort((a, b) => {
      const sa = parseDendreoDate(a.date_debut)?.getTime() ?? 0;
      const sb = parseDendreoDate(b.date_debut)?.getTime() ?? 0;
      return sa - sb;
    });
    return result;
  };

  const startOfWeek = useMemo(() => {
    const d = new Date(currentDate);
    d.setHours(0, 0, 0, 0);
    // Week starts on Sunday to match headers [Dim..Sam] alignment with getDay()
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [currentDate]);

  const weekDates = useMemo(() => {
    const base = new Date(startOfWeek);
    return Array.from({ length: 7 }, (_, i) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + i));
  }, [startOfWeek]);

  const titleText = useMemo(() => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (view === 'week') {
      const start = weekDates[0];
      const end = weekDates[6];
      const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
      if (sameMonth) {
        return `${start.toLocaleDateString('fr-FR', { day: 'numeric' })}–${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      }
      return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} – ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    return `${monthName} ${year}`;
  }, [view, currentDate, weekDates, monthName, year]);

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
            className="mt-1 text-left text-[11px] md:text-xs p-1 rounded hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <div className={`block sm:hidden h-1.5 rounded-full ${presenceBg(s?.lcps?.[0]?.presence)}`} />
            <div className={`hidden sm:block p-1 rounded ${presenceColor(s?.lcps?.[0]?.presence)}`}>
              <div className="font-medium truncate">{s.name || 'Session'}</div>
              <div className="opacity-90">{timeRange(s.date_debut, s.date_fin)}</div>
            </div>
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
        {(() => {
          const { setHeader } = useOutletContext() || {};
          useEffect(() => {
            setHeader && setHeader('Calendrier', '');
          }, [setHeader]);
          return null;
        })()}
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="order-1 text-center text-xl font-semibold text-white capitalize sm:order-none">{titleText}</h3>
            <div className="order-2 flex items-center justify-center gap-2 sm:order-none">
              <Button onClick={prevByView} variant="ghost" size="icon" className="text-white hover:bg-white/20" aria-label="Précédent">
                <ChevronLeft />
              </Button>
              <div className="inline-flex items-center rounded-md bg-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setView('day')}
                  aria-pressed={view === 'day'}
                  className={`px-2 py-1 text-xs font-medium rounded ${view === 'day' ? 'bg-purple-600 text-white shadow' : 'text-white/80 hover:bg-white/10'}`}
                >
                  Jour
                </button>
                <button
                  type="button"
                  onClick={() => setView('week')}
                  aria-pressed={view === 'week'}
                  className={`px-2 py-1 text-xs font-medium rounded ${view === 'week' ? 'bg-purple-600 text-white shadow' : 'text-white/80 hover:bg-white/10'}`}
                >
                  Semaine
                </button>
                <button
                  type="button"
                  onClick={() => setView('month')}
                  aria-pressed={view === 'month'}
                  className={`px-2 py-1 text-xs font-medium rounded ${view === 'month' ? 'bg-purple-600 text-white shadow' : 'text-white/80 hover:bg-white/10'}`}
                >
                  Mois
                </button>
              </div>
              <Button onClick={nextByView} variant="ghost" size="icon" className="text-white hover:bg-white/20" aria-label="Suivant">
                <ChevronRight />
              </Button>
            </div>
          </div>
          {(loading || adfLoading) && (
            <Skeleton className="h-[60vh] w-full rounded-md" />
          )}
          {error && <div className="text-red-300 mb-2 text-sm">{error}</div>}
          {!(adfLoading || loading) && (
            <>
              {view === 'month' && (
                <>
                  <div className="grid grid-cols-7 text-center text-white/70 mb-2">
                    {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => <div key={day}>{day}</div>)}
                  </div>
                  <div className="grid grid-cols-7 h-[60vh]">
                    {calendarDays}
                  </div>
                </>
              )}
              {view === 'week' && (
                <>
                  <div className="grid grid-cols-7 text-center text-white/70 mb-2">
                    {weekDates.map((d, idx) => (
                      <div key={idx} className="capitalize">
                        {d.toLocaleDateString('fr-FR', { weekday: 'short' })} {d.getDate()}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 h-[40vh]">
                    {weekDates.map((d, idx) => {
                      const isToday = isSameDay(d, today);
                      const daySessions = getSessionsForDate(d);
                      return (
                        <div key={idx} className={`p-2 border border-white/10 flex flex-col gap-1 relative ${isToday ? 'bg-purple-500/30' : ''}`}>
                          <span className={`font-semibold ${isToday ? 'text-purple-300' : 'text-white'}`}>{d.getDate()}</span>
                          {daySessions.map((s) => (
                            <button
                              key={s.id_creneau}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelected({ session: s, anchorDay: d.getDate() });
                              }}
                              className="mt-1 text-left text-[11px] md:text-xs p-1 rounded hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40"
                            >
                              <div className={`block sm:hidden h-1.5 rounded-full ${presenceBg(s?.lcps?.[0]?.presence)}`} />
                              <div className={`hidden sm:block p-1 rounded ${presenceColor(s?.lcps?.[0]?.presence)}`}>
                                <div className="font-medium truncate">{s.name || 'Session'}</div>
                                <div className="opacity-90">{timeRange(s.date_debut, s.date_fin)}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {view === 'day' && (
                <div className="h-[40vh] overflow-auto border border-white/10 rounded-md p-3">
                  {(() => {
                    const daySessions = getSessionsForDate(currentDate);
                    if (!daySessions.length) {
                      return <div className="text-white/60 text-sm">Aucune session pour ce jour.</div>;
                    }
                    return (
                      <div className="flex flex-col gap-2">
                        {daySessions.map((s) => (
                          <button
                            key={s.id_creneau}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected({ session: s, anchorDay: currentDate.getDate() });
                            }}
                            className="w-full text-left text-sm p-2 rounded hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40"
                          >
                            <div className={`block sm:hidden h-2 rounded-full ${presenceBg(s?.lcps?.[0]?.presence)}`} />
                            <div className={`hidden sm:block p-2 rounded ${presenceColor(s?.lcps?.[0]?.presence)}`}>
                              <div className="font-medium truncate">{s.name || 'Session'}</div>
                              <div className="opacity-90 text-[12px]">{timeRange(s.date_debut, s.date_fin)}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}
          {(!adfLoading && (adfError || (!loading && adfIds.length === 0))) && (
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
                {extranetCode && (
                  <div className="rounded-md bg-white/5 border border-white/10 p-3 flex items-center justify-between">
                    <div>
                      <div className="text-white/70 text-xs">Votre code de connexion</div>
                      <div className="text-white font-mono tracking-wider text-sm select-all">{extranetCode}</div>
                    </div>
                    <button
                      type="button"
                      className="text-white/70 hover:text-white p-2 rounded-md hover:bg-white/10"
                      onClick={() => extranetCode && navigator.clipboard?.writeText?.(String(extranetCode))}
                      aria-label="Copier le code"
                      title="Copier le code"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <a
                  href={selected.session?.url_connexion || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 text-sm font-medium disabled:opacity-60"
                >
                  Rejoindre la réunion
                </a>
              </div>
            </div>
          </div>
        )}
      </motion.section>
    </>
  );
};

export default CalendarPage;