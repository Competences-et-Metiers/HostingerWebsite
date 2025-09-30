import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import SkillsSection from '@/components/SkillsSection';
import GoalsSection from '@/components/GoalsSection';
import ProgressSection from '@/components/ProgressSection';
import ResourcesSection from '@/components/ResourcesSection';
import CalendarPage from '@/pages/CalendarPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import CVGeneratorPage from '@/pages/CVGeneratorPage';
import ConsultantPage from '@/pages/ConsultantPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import { useAuth } from '@/contexts/SupabaseAuthContext';

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
        <div className="text-white text-2xl">Chargement...</div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/" />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="skills" element={<SkillsSection />} />
          <Route path="goals" element={<GoalsSection />} />
          <Route path="progress" element={<ProgressSection />} />
          <Route path="resources" element={<ResourcesSection />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="cv-generator" element={<CVGeneratorPage />} />
          <Route path="consultant" element={<ConsultantPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;