import React from 'react';
import { motion } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

const notifications = [
  { id: 1, title: "Nouveau message de votre coach", time: "il y a 5 min", read: false },
  { id: 2, title: "Objectif 'Apprendre React' atteint!", time: "il y a 2 heures", read: false },
  { id: 3, title: "Rappel: session de suivi demain", time: "il y a 1 jour", read: true },
  { id: 4, title: "Nouvelle ressource ajoutée", time: "il y a 3 jours", read: true },
];

const NotificationsPanel = ({ onClose }) => {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.5, ease: [0.6, 0.01, -0.05, 0.9] }}
      className="absolute top-0 right-0 h-full w-80 bg-black/30 backdrop-blur-xl border-l border-white/10 flex flex-col z-50"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Notifications
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white/80 hover:text-white">
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`p-3 rounded-lg transition-colors cursor-pointer ${
              notif.read ? 'bg-white/5' : 'bg-purple-500/20 hover:bg-purple-500/30'
            }`}
          >
            <div className="flex justify-between items-start">
              <p className="text-sm text-white font-medium">{notif.title}</p>
              {!notif.read && <div className="w-2 h-2 rounded-full bg-purple-400 mt-1 ml-2 flex-shrink-0"></div>}
            </div>
            <p className="text-xs text-white/60">{notif.time}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default NotificationsPanel;