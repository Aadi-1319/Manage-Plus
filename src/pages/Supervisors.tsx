import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";

import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import SupervisorTable from '@/components/Supervisors/SupervisorTable';
import SupervisorDialog from '@/components/Supervisors/SupervisorDialog';

const Supervisors: React.FC = () => {
  const { company, user,role } = useAuth();
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadSupervisors();
  }, [company]);

  const loadSupervisors = () => {
    const allUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const companySupervisors = allUsers.filter(
      u => u.role === 'SUPERVISOR' && u.companyId === company?.id
    );
    setSupervisors(companySupervisors);
  };

  const handleDelete = (id: string) => {
    const allUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const updated = allUsers.filter(u => u.id !== id);
    localStorage.setItem('users', JSON.stringify(updated));
    loadSupervisors();
  };

  const handleSave = (supervisor: Partial<User>) => {
    const allUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (allUsers.find(u => u.email === supervisor.email)) {
      throw new Error('Email already exists');
    }

    const newSupervisor: User = {
      id: `user_${Date.now()}`,
      email: supervisor.email!,
      fullName: supervisor.fullName!,
      role: 'SUPERVISOR',
      companyId: company!.id,
      aadhar: supervisor.aadhar,
      pan: supervisor.pan,
      address: supervisor.address,
      createdAt: new Date().toISOString(),
    };

    allUsers.push(newSupervisor);
    localStorage.setItem('users', JSON.stringify(allUsers));
    
    loadSupervisors();
    setDialogOpen(false);
  };

  if (role !== 'OWNER') {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don't have permission to view this page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supervisors</h1>
          <p className="text-muted-foreground mt-1">Manage your team supervisors</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Supervisor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Supervisors</CardTitle>
        </CardHeader>
        <CardContent>
          <SupervisorTable supervisors={supervisors} onDelete={handleDelete} />
        </CardContent>
      </Card>

      <SupervisorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />
    </div>
  );
};

export default Supervisors;
