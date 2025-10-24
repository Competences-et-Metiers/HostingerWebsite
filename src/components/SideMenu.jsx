import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Star, Target, TrendingUp, BookOpen, Settings, LogOut, Calendar, FileText, UserSquare, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/" },
  { icon: Star, label: "Compétences", path: "/skills" },
  { icon: Target, label: "Objectifs", path: "/goals" },
  { icon: TrendingUp, label: "Progrès", path: "/progress" },
  { icon: BookOpen, label: "Ressources", path: "/resources" },
  { icon: Calendar, label: "Calendrier", path: "/calendar" },
  { icon: FileText, label: "Générateur de CV", path: "/cv-generator" },
  { icon: UserSquare, label: "Mon Consultant", path: "/consultant" },
];

const NavItem = ({ icon: Icon, label, path, delay, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <NavLink
        to={path}
        end={path === "/"}
        onClick={() => {
          if (typeof onClose === 'function') {
            onClose();
          }
        }}
        className={({ isActive }) =>
          `w-full justify-start text-white/80 hover:text-white hover:bg-white/10 py-4 px-4 flex items-center rounded-lg transition-colors ${
            isActive ? 'bg-white/10 text-white' : ''
          }`
        }
      >
        <Icon className="h-5 w-5 mr-4" />
        <span className="text-sm font-medium">{label}</span>
      </NavLink>
    </motion.div>
  );
};

const SideMenu = ({ onClose }) => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès.",
    });
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleSettings = () => {
    navigate('/settings');
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <motion.aside
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.6, 0.01, -0.05, 0.9] }}
      className="fixed top-0 left-0 h-screen w-72 z-50 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between p-4 pt-12"
    >
      <div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center space-x-3 p-4 mb-8"
        >
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">BC</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white whitespace-nowrap">Bilan de Compétences</h1>
            <p className="text-purple-200 text-xs">Mon Parcours</p>
          </div>
        </motion.div>

        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <NavItem key={item.label} icon={item.icon} label={item.label} path={item.path} delay={0.4 + index * 0.08} onClose={onClose} />
          ))}
        </nav>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="space-y-2"
      >
        <Button
          variant="ghost"
          onClick={handleSettings}
          className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10 py-4"
        >
          <Settings className="h-5 w-5 mr-4" />
          <span className="text-sm font-medium">Paramètres</span>
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 py-4"
        >
          <LogOut className="h-5 w-5 mr-4" />
          <span className="text-sm font-medium">Déconnexion</span>
        </Button>
      </motion.div>
    </motion.aside>
  );
};

export default SideMenu;