import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Mail, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { fetchAdfIds, fetchConsultantsByAdfIds, formatFrenchPhoneNumber, fetchStaffById } from '@/lib/dendreo';
import { Skeleton } from '@/components/ui/skeleton';

const ConsultantPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consultants, setConsultants] = useState([]);
  const [staff, setStaff] = useState(null);

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

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const adfRes = await fetchAdfIds();
        const adfIds = Array.isArray(adfRes?.adf_ids) ? adfRes.adf_ids : [];
        if (!adfIds.length) {
          if (isMounted) setConsultants([]);
          if (isMounted) setStaff(null);
          return;
        }
        const cRes = await fetchConsultantsByAdfIds(adfIds);
        const list = Array.isArray(cRes?.consultants) ? cRes.consultants : [];
        if (isMounted) setConsultants(list);

        // Try to get one id_responsable from the first available ADF in map
        const respoMap = adfRes?.adf_responsables || {};
        const firstAdfId = adfIds.find(id => respoMap && respoMap[id]);
        if (firstAdfId) {
          const staffId = respoMap[firstAdfId];
          if (staffId) {
            try {
              const s = await fetchStaffById(staffId);
              if (isMounted) setStaff(s);
            } catch (e) {
              // non blocking
            }
          }
        }
      } catch (e) {
        const msg = e?.message || 'Erreur lors du chargement des consultants';
        setError(msg);
        toast({ variant: 'destructive', title: 'Erreur', description: msg });
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => { isMounted = false; };
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
        <h2 className="text-3xl font-bold text-white mb-2">Mon Consultant</h2>

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
                    <p className="text-purple-200">Consultant en évolution professionnelle</p>

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
                <p className="text-purple-200">{staff?.fonction || 'Conseiller Pédagogique'}</p>
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
                  {(() => {
                    const nom = slugify(staff?.nom);
                    const prenom = slugify(staff?.prenom);
                    const meetingUrl = nom && prenom ? `https://meetings-eu1.hubspot.com/${prenom}-${nom}` : null;
                    return meetingUrl ? (
                      <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
                        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 text-base">
                          <Calendar className="w-5 h-5 mr-2" />
                          Prendre rendez-vous
                        </Button>
                      </a>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          </>
        )}

        
      </motion.section>
    </>
  );
};

export default ConsultantPage;