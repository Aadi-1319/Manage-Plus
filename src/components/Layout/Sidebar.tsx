import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";

import {
  LayoutDashboard,
  Users,
  UserCog,
  ClipboardList,
  Calendar,
  FileText,
  Settings,
  LogOut,
  UserCircle,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const { user,role,logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['OWNER', 'SUPERVISOR'] },
    { icon: Users, label: 'Employees', path: '/employees', roles: ['OWNER', 'SUPERVISOR'] },
    { icon: UserCog, label: 'Supervisors', path: '/supervisors', roles: ['OWNER'] },
    { icon: UserCircle, label: 'My Profile', path: '/profile', roles: ['SUPERVISOR'] },
    { icon: ClipboardList, label: 'Attendance', path: '/attendance', roles: ['OWNER', 'SUPERVISOR'] },
    { icon: Calendar, label: 'Attendance History', path: '/attendance-history', roles: ['OWNER', 'SUPERVISOR'] },
    { icon: FileText, label: 'Reports', path: '/reports', roles: ['OWNER'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['OWNER', 'SUPERVISOR'] },
    { icon: Shield, label: 'Admin Panel', path: '/admin', roles: ['ADMIN'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(role || 'SUPERVISOR')
  );

  return (
    <aside className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold text-primary">Manage-plus</h1>
        <p className="text-sm text-muted-foreground mt-1">{role} - {user.full_name}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
