import React, { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";import Sidebar from './Sidebar';
import Header from './Header';
import SplashScreen from '@/components/SplashScreen';
import SubscriptionReminderDialog from '@/components/SubscriptionReminderDialog';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DashboardLayout: React.FC = () => {
const { user,role,loading,company } = useAuth(); 
 const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowSplash(false), 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  
if (loading || showSplash) {
  return <SplashScreen />;
}

if (!user) return <Navigate to="/login" replace />;


  // Check subscription status
  const isSubscriptionExpired = company?.subscriptionStatus === 'expired' || 
    (company?.subscriptionEndDate && new Date(company.subscriptionEndDate) < new Date());

  if (isSubscriptionExpired) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-6 max-w-md p-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Subscription Expired</h1>
            <p className="text-muted-foreground">
              Your subscription has expired. Please renew to continue using the application.
            </p>
          </div>
          <Button size="lg" className="w-full">
            Renew Subscription
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SubscriptionReminderDialog company={company} />
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;