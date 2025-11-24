import React, { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";

import Sidebar from './Sidebar';
import Header from './Header';
import SplashScreen from '@/components/SplashScreen';

const DashboardLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || showSplash) {
    return <SplashScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
