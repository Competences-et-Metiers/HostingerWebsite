import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, FileText, Copy } from 'lucide-react';
import ErrorState from '@/components/ErrorState';

const CVGeneratorPage = () => {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [generatedCV, setGeneratedCV] = useState('');
  const [displayedCV, setDisplayedCV] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Load CV from session storage on mount
  useEffect(() => {
    const savedCV = sessionStorage.getItem('generated_cv');
    const savedInstructions = sessionStorage.getItem('cv_instructions');
    
    if (savedCV) {
      setGeneratedCV(savedCV);
      setDisplayedCV(savedCV); // Show immediately from cache, no typing effect
    }
    if (savedInstructions) {
      setAdditionalInstructions(savedInstructions);
    }
  }, []);

  // Typewriter effect for newly generated CV
  useEffect(() => {
    if (!generatedCV || displayedCV === generatedCV) return;

    setIsTyping(true);
    let currentIndex = 0;
    const typingSpeed = 7; // milliseconds per character (doubled speed from 15ms)

    const typeInterval = setInterval(() => {
      if (currentIndex < generatedCV.length) {
        setDisplayedCV(generatedCV.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, typingSpeed);

    return () => clearInterval(typeInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedCV]);

  const generateCV = async () => {
    if (!session) {
      toast({
        variant: "destructive",
        title: "Authentification Requise",
        description: "Vous devez être connecté pour générer un CV.",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedCV('');

    try {
      const { data, error } = await supabase.functions.invoke('generate-cv', {
        body: {
          additionalInstructions: additionalInstructions.trim(),
        },
      });

      if (error) throw error;

      if (data && data.cv) {
        setDisplayedCV(''); // Reset displayed text for typing effect
        setGeneratedCV(data.cv);
        // Save to session storage
        sessionStorage.setItem('generated_cv', data.cv);
        sessionStorage.setItem('cv_instructions', additionalInstructions.trim());
        sessionStorage.setItem('cv_timestamp', new Date().toISOString());
        
        toast({
          title: "CV Généré avec Succès !",
          description: "Votre CV a été généré. Vous pouvez maintenant le copier ou le télécharger.",
        });
      } else {
        throw new Error("Aucun contenu de CV reçu");
      }
    } catch (error) {
      console.error('Error generating CV:', error);
      toast({
        variant: "destructive",
        title: "Échec de la Génération",
        description: error.message || "Échec de la génération du CV. Veuillez réessayer.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCV);
    toast({
      title: "Copié !",
      description: "CV copié dans le presse-papiers.",
    });
  };

  const downloadAsText = () => {
    const blob = new Blob([generatedCV], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CV_${user?.email || 'user'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Téléchargé !",
      description: "CV téléchargé en fichier texte.",
    });
  };

  const clearCV = () => {
    setGeneratedCV('');
    setDisplayedCV('');
    sessionStorage.removeItem('generated_cv');
    sessionStorage.removeItem('cv_instructions');
    sessionStorage.removeItem('cv_timestamp');
    toast({
      title: "CV Effacé",
      description: "Le CV a été supprimé. Vous pouvez en générer un nouveau.",
    });
  };

  // Format CV text for better display
  const formatCVForDisplay = (cvText) => {
    if (!cvText) return null;

    const lines = cvText.split('\n');
    const formattedElements = [];
    let currentKey = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines (but preserve spacing)
      if (!trimmedLine) {
        formattedElements.push(<div key={`empty-${currentKey++}`} className="h-4" />);
        return;
      }

      // Section headers (ALL CAPS or starting with **)
      if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3 && /^[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ\s]+$/.test(trimmedLine)) {
        formattedElements.push(
          <h3 key={`section-${currentKey++}`} className="text-xl font-bold text-purple-300 mt-6 mb-3 tracking-wide">
            {trimmedLine}
          </h3>
        );
      }
      // Bold headers with ** or numbered sections
      else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        const text = trimmedLine.replace(/^\*\*|\*\*$/g, '');
        formattedElements.push(
          <h4 key={`header-${currentKey++}`} className="text-lg font-semibold text-white mt-4 mb-2">
            {text}
          </h4>
        );
      }
      // Bullet points
      else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        const text = trimmedLine.replace(/^[•\-\*]\s*/, '');
        formattedElements.push(
          <div key={`bullet-${currentKey++}`} className="flex gap-3 mb-2 ml-4">
            <span className="text-purple-300 mt-1">•</span>
            <span className="text-white/90 flex-1">{text}</span>
          </div>
        );
      }
      // Section dividers
      else if (trimmedLine.match(/^[-=_]{3,}$/)) {
        formattedElements.push(
          <hr key={`divider-${currentKey++}`} className="border-white/20 my-4" />
        );
      }
      // Regular paragraphs
      else {
        formattedElements.push(
          <p key={`text-${currentKey++}`} className="text-white/90 mb-2 leading-relaxed">
            {trimmedLine}
          </p>
        );
      }
    });

    return formattedElements;
  };

  return (
    <>
      <Helmet>
        <title>Générateur de CV - Plateforme Bilan de Compétences</title>
        <meta name="description" content="Créez un CV professionnel en quelques clics." />
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
            setHeader && setHeader('Générateur de CV', "Utilisez l'IA pour transformer vos compétences et expériences en un CV percutant et professionnel.");
          }, [setHeader]);
          return null;
        })()}
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-8 w-8 text-purple-400" />
            <h3 className="text-2xl font-semibold text-white">Générer votre CV</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="instructions" className="block text-white/90 font-medium mb-2">
                Instructions supplémentaires (optionnel)
              </label>
              <p className="text-white/60 text-sm mb-3">
                Décrivez vos expériences professionnelles, formations, compétences, ou toute autre information que vous souhaitez inclure dans votre CV.
              </p>
              <textarea
                id="instructions"
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="Exemple : Je suis consultant en Diagnostic de Performance Énergétique (DPE) avec 3 ans d'expérience. J'ai réalisé plus de 200 diagnostics sur des bâtiments résidentiels et commerciaux. Formation : Licence en Génie Thermique. Compétences : thermique du bâtiment, réglementation RT2012/RE2020, logiciels de calcul énergétique..."
                className="w-full h-48 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                disabled={isGenerating}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={generateCV}
                disabled={isGenerating || !user}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-5 w-5" />
                    Générer le CV
                  </>
                )}
              </Button>
            </div>

            {!user && (
              <p className="text-yellow-400 text-sm">
                Vous devez être connecté pour générer un CV.
              </p>
            )}
          </div>
        </div>

        {(generatedCV || displayedCV) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 max-w-4xl mx-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h3 className="text-2xl font-semibold text-white">Votre CV Généré</h3>
              <div className="flex gap-3">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copier
                </Button>
                <Button
                  onClick={downloadAsText}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Télécharger (.txt)
                </Button>
                <Button
                  onClick={clearCV}
                  variant="outline"
                  size="sm"
                  className="bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30"
                >
                  Effacer
                </Button>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 border border-white/10 shadow-xl relative">
              <div className="max-w-none">
                {formatCVForDisplay(displayedCV)}
              </div>
              {isTyping && (
                <span className="inline-block w-0.5 h-5 bg-purple-300 animate-pulse ml-1"></span>
              )}
            </div>
            
            {!isTyping && (
              <details className="mt-4">
                <summary className="text-white/60 text-sm cursor-pointer hover:text-white/80 font-medium">
                  Voir le texte brut (pour copier/coller)
                </summary>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 mt-2">
                  <pre className="text-white/70 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {generatedCV}
                  </pre>
                </div>
              </details>
            )}
          </motion.div>
        )}
      </motion.section>
    </>
  );
};

export default CVGeneratorPage;