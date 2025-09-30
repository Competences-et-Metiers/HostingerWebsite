import React from 'react';
import { motion } from 'framer-motion';
import { User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ onToggleNotifications }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userName = user?.user_metadata?.first_name || user?.email || 'Utilisateur';

  const handleProfile = () => {
    navigate('/profile');
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/5 backdrop-blur-lg border-b border-white/10"
    >
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Bienvenue, {userName} !</h1>
            <p className="text-purple-200 text-sm">Prêt à développer votre potentiel ?</p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleNotifications}
              className="text-white hover:bg-white/10"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleProfile}
              className="text-white hover:bg-white/10"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;