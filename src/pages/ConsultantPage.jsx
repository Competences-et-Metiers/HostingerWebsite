import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Mail, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { fetchAdfIds, fetchConsultantsByAdfIds, formatFrenchPhoneNumber, fetchStaffById } from '@/lib/dendreo';

const ConsultantPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consultants, setConsultants] = useState([]);
  const [staff, setStaff] = useState(null);

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
  }, [toast]);

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
      {!loading && !error && staff && (
        <Helmet>
          <script
            type="text/javascript"
            src="https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js"
            defer
          />
        </Helmet>
      )}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <h2 className="text-3xl font-bold text-white mb-2">Mon Consultant</h2>

        {loading && (
          <div className="text-purple-200">Chargement des informations...</div>
        )}

        {!loading && error && (
          <div className="text-red-300">{error}</div>
        )}

        {!loading && !error && consultants.length === 0 && (
          <div className="text-purple-200">Aucun consultant associé à vos sessions.</div>
        )}

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
                          <span>{email}</span>
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center justify-center md:justify-start gap-3 text-white/80">
                          <Phone className="w-5 h-5 text-purple-300" />
                          <span>{phone}</span>
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
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Mon Conseiller Pédagogique</h3>
            <div className="space-y-2 text-white/90">
              <div className="text-white"><span className="text-purple-300">{staff?.fonction || 'Conseiller Pédagogique'}</span></div>
              <div>{[staff?.nom, staff?.prenom].filter(Boolean).join(' ')}</div>
              {staff?.email && (
                <div className="flex items-center gap-2"><Mail className="w-5 h-5 text-purple-300" /><span>{staff.email}</span></div>
              )}
              {staff?.telephone && (
                <div className="flex items-center gap-2"><Phone className="w-5 h-5 text-purple-300" /><span>{formatFrenchPhoneNumber(String(staff.telephone))}</span></div>
              )}
            </div>
          </div>
        )}

        {!loading && !error && staff && (
          <div className="mt-6">
            <div className="meetings-iframe-container" data-src="https://meetings-eu1.hubspot.com/gabriel-grange?embed=true"></div>
          </div>
        )}
      </motion.section>
    </>
  );
};

export default ConsultantPage;