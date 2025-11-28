import React from 'react';

const VeriLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Employee Management</h1>
          <p className="text-muted-foreground">Loading... Check your Email and verify!</p>
        </div>
      </div>
    </div>
  );
};

export default VeriLoader;
