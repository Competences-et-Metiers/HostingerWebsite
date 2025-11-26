import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Mail, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { formatFrenchPhoneNumber } from '@/lib/dendreo';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdfIds } from '@/hooks/useDendreoData';
import { useConsultants, useStaff } from '@/hooks/useConsultantData';

const ConsultantPage = () => {
  const { toast } = useToast();
  
  // Use cached hooks
  const { data: adfData, isLoading: adfLoading, error: adfError } = useAdfIds();
  const adfIds = Array.isArray(adfData?.adf_ids) ? adfData.adf_ids : [];
  const { data: consultants = [], isLoading: consultantsLoading, error: consultantsError } = useConsultants(adfIds);
  
  // Get staff ID from first available ADF
  const staffId = useMemo(() => {
    const respoMap = adfData?.adf_responsables || {};
    const firstAdfId = adfIds.find(id => respoMap && respoMap[id]);
    return firstAdfId ? respoMap[firstAdfId] : null;
  }, [adfData, adfIds]);
  
  const { data: staff = null, isLoading: staffLoading } = useStaff(staffId);
  
  const loading = adfLoading || consultantsLoading || staffLoading;
  const error = adfError || consultantsError;
  const meetingsRef = useRef(null);
  const [embedReady, setEmbedReady] = useState(false);
  const [isFramed, setIsFramed] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const [showMeetingEmbed, setShowMeetingEmbed] = useState(false);
  const meetingsContainerRef = useRef(null);

  const slugify = (value) => {
    if (!value) return '';
    return String(value)
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const buildTelHref = (input) => {
    if (!input) return '';
    const raw = String(input).trim();
    const digits = raw.replace(/\D/g, '');
    let e164 = '';
    if (raw.startsWith('+')) {
      e164 = '+' + digits;
    } else if (digits.startsWith('33')) {
      e164 = '+' + digits;
    } else if (digits.startsWith('0')) {
      e164 = '+33' + digits.slice(1);
    } else {
      e164 = '+' + digits;
    }
    return `tel:${e164}`;
  };

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      const msg = error?.message || 'Erreur lors du chargement des consultants';
      toast({ variant: 'destructive', title: 'Erreur', description: msg });
    }
  }, [error, toast]);

  // Load HubSpot Meetings embed script once
  useEffect(() => {
    const src = 'https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js';
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return;
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Ensure script initializes after container is in DOM and user requested it
  useEffect(() => {
    if (!staff || !showMeetingEmbed || !meetingsRef.current) return;
    // reset state on each open
    setEmbedReady(false);
    setEmbedFailed(false);
    const src = 'https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js';
    // Re-append script to force re-scan if needed
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    script.async = true;
    document.body.appendChild(script);

    const start = Date.now();
    const interval = setInterval(() => {
      const iframe = meetingsRef.current?.querySelector('iframe');
      if (iframe) {
        setEmbedReady(true);
        setEmbedFailed(false);
        clearInterval(interval);
      } else if (Date.now() - start > 5000) {
        setEmbedFailed(true);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [staff, showMeetingEmbed]);

  // Detect if app runs inside an iframe (builder/preview environments)
  useEffect(() => {
    try {
      setIsFramed(window.top !== window.self);
    } catch {
      setIsFramed(true);
    }
  }, []);

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
        {(() => {
          const { setHeader } = useOutletContext() || {};
          useEffect(() => {
            setHeader && setHeader('Mon Consultant', '');
          }, [setHeader]);
          return null;
        })()}

        {loading && (
          <div className="grid gap-6">
            {Array.from({ length: 1 }).map((_, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 flex flex-col md:flex-row items-center gap-8">
                <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full" />
                <div className="flex-1 w-full">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/4 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <div className="mt-6">
                    <Skeleton className="h-10 w-40 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-red-300">{error}</div>
        )}

        {!loading && !error && consultants.length === 0 && null}

        {!loading && !error && consultants.length > 0 && (
          <div className="grid gap-6">
            {consultants.map((c, idx) => {
              const fullName = [c?.nom, c?.prenom].filter(Boolean).join(' ');
              const email = c?.email_pro || '';
              const phone = formatFrenchPhoneNumber(c?.telephone_pro || '');
              const photo = (c?.photo_url && typeof c.photo_url === 'string' && c.photo_url.trim()) ? c.photo_url : '';
              const initials = fullName
                ? fullName.split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase() || '').join('')
                : 'C';
              return (
                <div key={`${c?.id_formateur || idx}`} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 flex flex-col md:flex-row items-center gap-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 * (idx + 1), duration: 0.4 }}
                  >
                    {photo ? (
                      <img
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-purple-500 shadow-lg"
                        alt="Photo de profil du consultant"
                        src={photo}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-purple-500 shadow-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-2xl md:text-3xl font-bold">
                        {initials}
                      </div>
                    )}
                  </motion.div>

                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-white">{fullName || 'Consultant'}</h3>
                    <div className="mt-6 space-y-3">
                      {email && (
                        <div className="flex items-center justify-center md:justify-start gap-3 text-white/80">
                          <Mail className="w-5 h-5 text-purple-300" />
                          <a href={`mailto:${email}`} className="hover:underline">{email}</a>
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center justify-center md:justify-start gap-3 text-white/80">
                          <Phone className="w-5 h-5 text-purple-300" />
                          <a href={buildTelHref(c?.telephone_pro)} className="hover:underline">{phone}</a>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-center md:justify-start">
                      <Button onClick={showToast} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 text-base">
                        <Calendar className="w-5 h-5 mr-2" />
                        Prendre rendez-vous
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && staff && (
          <>
            <h3 className="text-xl font-bold text-white">Mon Conseiller Pédagogique</h3>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 flex flex-col md:flex-row items-center gap-8">
              {(() => {
                const fullName = [staff?.nom, staff?.prenom].filter(Boolean).join(' ');
                const initials = fullName
                  ? fullName.split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase() || '').join('')
                  : 'CP';
                return (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-purple-500 shadow-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-2xl md:text-3xl font-bold">
                      {initials}
                    </div>
                  </motion.div>
                );
              })()}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-white">{[staff?.nom, staff?.prenom].filter(Boolean).join(' ') || 'Conseiller Pédagogique'}</h3>
                <div className="mt-6 space-y-3">
                  {staff?.email && (
                    <div className="flex items-center justify-center md:justify-start gap-3 text-white/80">
                      <Mail className="w-5 h-5 text-purple-300" />
                      <a href={`mailto:${staff.email}`} className="hover:underline">{staff.email}</a>
                    </div>
                  )}
                  {staff?.telephone && (
                    <div className="flex items-center justify-center md:justify-start gap-3 text-white/80">
                      <Phone className="w-5 h-5 text-purple-300" />
                      <a href={buildTelHref(String(staff.telephone))} className="hover:underline">{formatFrenchPhoneNumber(String(staff.telephone))}</a>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-center md:justify-start">
                  <Button
                    onClick={() => {
                      setShowMeetingEmbed(prev => {
                        const next = !prev;
                        if (next) {
                          setTimeout(() => {
                            meetingsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 50);
                        }
                        return next;
                      });
                    }}
                    aria-expanded={showMeetingEmbed}
                    aria-controls="meetings-embed"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 text-base"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    {showMeetingEmbed ? 'Fermer le calendrier de rendez-vous' : 'Ouvrir le calendrier de rendez-vous'}
                  </Button>
                </div>

                {/* Embedded HubSpot Meetings container; render on demand */}
                {showMeetingEmbed && (
                  <div ref={meetingsContainerRef} id="meetings-embed" className="mt-6 w-full">
                    <div
                      ref={meetingsRef}
                      className="meetings-iframe-container"
                      data-src="https://meetings-eu1.hubspot.com/tuan-le?embed=true"
                    ></div>
                    {embedFailed && (
                      <div className="mt-4">
                        <p className="text-white/80 mb-3">Le module de prise de rendez-vous ne peut pas s'afficher ici. Ouvrez-le dans un nouvel onglet :</p>
                        {(() => {
                          const nom = slugify(staff?.nom);
                          const prenom = slugify(staff?.prenom);
                          const fallbackUrl = nom && prenom ? `https://meetings-eu1.hubspot.com/${prenom}-${nom}` : 'https://meetings-eu1.hubspot.com/tuan-le';
                          return (
                            <a href={fallbackUrl} target="_blank" rel="noopener noreferrer">
                              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 text-base">
                                <Calendar className="w-5 h-5 mr-2" />
                                Ouvrir le calendrier
                              </Button>
                            </a>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        
      </motion.section>
    </>
  );
};

export default ConsultantPage;