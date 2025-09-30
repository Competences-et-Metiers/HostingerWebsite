import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CalendarPage = () => {
  const today = new Date();
  const monthName = today.toLocaleString('fr-FR', { month: 'long' });
  const year = today.getFullYear();

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const todayDate = today.getDate();

  const calendarDays = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`empty-${i}`} className="border border-white/10"></div>);
  
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(
      <div key={day} className={`p-2 border border-white/10 flex flex-col ${day === todayDate ? 'bg-purple-500/30' : ''}`}>
        <span className={`font-semibold ${day === todayDate ? 'text-purple-300' : 'text-white'}`}>{day}</span>
        {day === 15 && <div className="mt-2 text-xs bg-pink-500/50 p-1 rounded">Session Suivi</div>}
        {day === 22 && <div className="mt-2 text-xs bg-green-500/50 p-1 rounded">Atelier CV</div>}
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
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ChevronLeft />
            </Button>
            <h3 className="text-xl font-semibold text-white capitalize">{monthName} {year}</h3>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ChevronRight />
            </Button>
          </div>
          <div className="grid grid-cols-7 text-center text-white/70 mb-2">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 h-[60vh]">
            {calendarDays}
          </div>
        </div>
      </motion.section>
    </>
  );
};

export default CalendarPage;