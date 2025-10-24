import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Star, Target, TrendingUp, BookOpen, Settings, LogOut, Calendar, FileText, UserSquare, PanelLeft, X } from 'lucide-react';
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

const NavItem = ({ icon: Icon, label, path, delay, onClose, isOpen }) => {
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
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          if (isMobile && typeof onClose === 'function') {
            onClose();
          }
        }}
        className={({ isActive }) =>
          `${isOpen ? 'w-full justify-start px-3' : 'h-10 w-10 justify-center'} text-white/80 hover:text-white hover:bg-white/10 h-10 flex items-center rounded-md transition-colors ${
            isActive ? 'bg-white/10 text-white' : ''
          }`
        }
      >
        <Icon className={`h-5 w-5 ${isOpen ? 'mr-3' : ''}`} />
        {isOpen && <span className="text-sm font-medium truncate">{label}</span>}
      </NavLink>
    </motion.div>
  );
};

const SideMenu = ({ isOpen, onClose, onToggle }) => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès.",
    });
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile && typeof onClose === 'function') {
      onClose();
    }
  };

  const handleSettings = () => {
    navigate('/settings');
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile && typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <motion.aside
      initial={{ width: 56 }}
      animate={{ width: isOpen ? 288 : 56 }}
      transition={{ duration: 0.25, ease: [0.4, 0.01, -0.05, 0.9] }}
      className="fixed inset-y-0 left-0 z-50 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between py-4"
    >
      <div className={`flex flex-col ${isOpen ? 'px-2' : 'items-center px-2'}`}>
        <div className={`mb-2 ${isOpen ? 'w-full' : ''}`}>
          <Button
            variant="ghost"
            size={isOpen ? 'default' : 'icon'}
            onClick={onToggle}
            title={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            className={`text-white/80 hover:text-white hover:bg-white/10 ${isOpen ? 'h-10 w-full justify-start px-3 rounded-md' : ''}`}
          >
            {isOpen ? (
              <>
                <X className="h-5 w-5 mr-3" />
                <span className="text-sm font-medium">Fermer le menu</span>
              </>
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </Button>
        </div>
        <nav className="flex flex-col gap-1">
          {menuItems.map((item, index) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              path={item.path}
              delay={0.1 + index * 0.04}
              onClose={onClose}
              isOpen={isOpen}
            />
          ))}
        </nav>
      </div>
      <div className={`flex flex-col gap-1 px-2 ${isOpen ? '' : 'items-center'}`}>
        <Button
          variant="ghost"
          size={isOpen ? 'default' : 'icon'}
          onClick={handleSettings}
          title="Paramètres"
          className={`${isOpen ? 'h-10 w-full justify-start px-3' : 'h-10 w-10 justify-center'} text-white/80 hover:text-white hover:bg-white/10 rounded-md`}
        >
          <Settings className={`h-5 w-5 ${isOpen ? 'mr-3' : ''}`} />
          {isOpen && <span className="text-sm font-medium truncate">Paramètres</span>}
        </Button>
        <Button
          variant="ghost"
          size={isOpen ? 'default' : 'icon'}
          onClick={handleLogout}
          title="Déconnexion"
          className={`${isOpen ? 'h-10 w-full justify-start px-3' : 'h-10 w-10 justify-center'} text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md`}
        >
          <LogOut className={`h-5 w-5 ${isOpen ? 'mr-3' : ''}`} />
          {isOpen && <span className="text-sm font-medium truncate">Déconnexion</span>}
        </Button>
      </div>
    </motion.aside>
  );
};

export default SideMenu;