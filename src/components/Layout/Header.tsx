import React from 'react';
import { useAuth } from "@/hooks/useAuth";

import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Header: React.FC = () => {
  const { user, company } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground">{company?.name}</p>
          </div>
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.fullName ? getInitials(user.fullName) : 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;
