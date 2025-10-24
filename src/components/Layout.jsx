import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import SideMenu from '@/components/SideMenu';
import NotificationsPanel from '@/components/NotificationsPanel';

const Layout = () => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  useEffect(() => {
    const update = () => {
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
      setIsMenuOpen(isDesktop);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const [headerTitle, setHeaderTitle] = useState('');
  const [headerSubtitle, setHeaderSubtitle] = useState('');

  const setHeader = useCallback((title, subtitle = '') => {
    setHeaderTitle(title || '');
    setHeaderSubtitle(subtitle || '');
  }, []);

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex relative overflow-hidden`}>
      {/* Persistent sidebar rail that resizes; content shifts accordingly */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onToggle={() => setIsMenuOpen((v) => !v)} />
      <div className={`flex-1 flex flex-col`} style={{ marginLeft: isMenuOpen ? 288 : 56 }}>
        <Header
          onToggleNotifications={toggleNotifications}
          onToggleMenu={() => setIsMenuOpen((v) => !v)}
          title={headerTitle}
          subtitle={headerSubtitle}
        />
        <main className="flex-1 overflow-y-auto p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-12"
          >
            <Outlet context={{ setHeader }} />
          </motion.div>
        </main>
      </div>
      <AnimatePresence>
        {isNotificationsOpen && (
          <NotificationsPanel onClose={toggleNotifications} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;