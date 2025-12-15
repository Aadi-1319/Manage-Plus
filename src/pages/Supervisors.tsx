import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/lib/supabaseClient';

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
  if (company?.company_id) {
    loadSupervisors();
  }
}, [company?.company_id]);


 const loadSupervisors = async () => {
  if (!company?.company_id) return;
  console.log("compnay :",company)
  const { data, error } = await supabase
    .from('supervisor')
    .select('*')
    .eq('company_id', company.company_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  setSupervisors(
    data.map(s => ({
      supervisor_id: s.supervisor_id,
      fullName: s.full_name,
      email: s.email,
      role: 'SUPERVISOR',
      phone: s.phone,
      companyId: s.company_id,
      aadhar: s.aadhar,
      pan: s.pan,
      address: s.address,
      createdAt: s.created_at,
    }))
  );
};


 const handleDelete = async (supervisor_id?: string) => {
  if (!supervisor_id) {
    console.error('Delete called with invalid id:', supervisor_id);
    return;
  }

  const { error } = await supabase
    .from('supervisor')
    .delete()
    .eq('supervisor_id', supervisor_id);

  if (error) {
    console.error(error);
    return;
  }

  await loadSupervisors(); // ✅ INSIDE async function
};



  const handleSave = async (supervisor: Partial<User>) => {
    console.log(company.company_id)
  if (!company?.company_id) throw new Error('Company not found');

  const { error } = await supabase
    .from('supervisor')
    .insert({
      full_name: supervisor.fullName,
      email: supervisor.email,
      company_id: company.company_id,
      phone: supervisor.phone,
      aadhar: supervisor.aadhar,
      pan: supervisor.pan,
      address: supervisor.address,
    });

  if (error) {
    if (error.code === '23505') {
      throw new Error('Email already exists');
    }
    throw error;
  }

  await loadSupervisors();
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
