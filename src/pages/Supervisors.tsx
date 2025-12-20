import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/lib/supabaseClient';

import { Supervisor} from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import SupervisorTable from '@/components/Supervisors/SupervisorTable';
import SupervisorDialog from '@/components/Supervisors/SupervisorDialog';

const Supervisors: React.FC = () => {
  const { company, user,role } = useAuth();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

 useEffect(() => {
  if (company?.company_id) {
    loadSupervisors();
  }
}, [company?.company_id]);


 const loadSupervisors = async () => {
  if (!company?.company_id) return;
  const { data, error } = await supabase
    .from('supervisor')
    .select('*')
    .eq('company_id', company.company_id)
    .in('status', ['ACTIVE', 'INVITED'])
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

const handleDelete = async (email?: string) => {
  if (!email) {
    console.error('Delete called with invalid id or email:', email);
    return;
  }

  const session = (await supabase.auth.getSession()).data.session;

if (!session) {
  console.error('Not authenticated');
  return;
}

  try {
    const res = await fetch('https://cbfkbkywqndothzrydyv.supabase.co/functions/v1/delete-supervisor', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`, // <-- important
      },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error || 'Failed to delete supervisor');
    }

    await loadSupervisors(); // refresh the supervisor list
    console.log('Supervisor deleted successfully!');
  } catch (error) {
    console.error('Error deleting supervisor:', error);
  }
};


const handleEdit = (supervisor: Supervisor) => {
    console.log('Editing supervisor:', supervisor.supervisor_id);
    setEditingSupervisor(supervisor);
    setDialogOpen(true);
  };

 const handleSave = async (supervisor: Partial<Supervisor>) => {
  if (!company?.company_id) {
    throw new Error("Company not found");
  }
  console.log(supervisor)
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) {
    throw new Error("Not authenticated");
  }

  
const basePayload = {
    full_name: supervisor.fullName,
    email: supervisor.email,
    phone: supervisor.phone,
    aadhar: supervisor.aadhar,
    pan: supervisor.pan,
    address: supervisor.address,
  };

 if (editingSupervisor?.supervisor_id) {
    const { error } = await supabase
      .from('supervisor')
      .update(basePayload)
      .eq('supervisor_id', editingSupervisor.supervisor_id);
    if (error) throw error;
    if (error) {
      if (error.code === '23505') {
        throw new Error('Email already exists');
      }
      throw error;
    }
} else {

  const res = await fetch(
  "https://cbfkbkywqndothzrydyv.supabase.co/functions/v1/invite-supervisor",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      email: supervisor.email,
      full_name: supervisor.fullName,
      phone: supervisor.phone ?? null,
      aadhar: supervisor.aadhar ?? null,
      pan: supervisor.pan ?? null,
      address: supervisor.address ?? null,
      company_id: company.company_id,
      owner_id: user.id
    }),
  }
);
if (!res.ok) {
    const err = await res.json();
    console.error("Invite error:", err);
    throw new Error(err.error || "Failed to invite supervisor");
}
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
          <SupervisorTable supervisors={supervisors} onDelete={handleDelete} onEdit={handleEdit}/>
        </CardContent>
      </Card>

      <SupervisorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supervisor={editingSupervisor}
        onSave={handleSave}
      />
    </div>
  );
};

export default Supervisors;
