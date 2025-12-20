import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import * as XLSX from 'xlsx';
import { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, FileDown, Upload } from 'lucide-react';
import EmployeeTable from '@/components/Employees/EmployeeTable';
import EmployeeDialog, { EmployeePayload } from '@/components/Employees/EmployeeDialog';
import EmployeeHistoryDialog from '@/components/Employees/EmployeeHistoryDialog';
import ExcelImportDialog from '@/components/Employees/ExcelImportDialog';

import { supabase } from "@/lib/supabaseClient";
import { toast } from '@/hooks/use-toast';

const Employees: React.FC = () => {
  const { company, user ,role} = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, [company]);

  useEffect(() => {
    const statusFilter = activeTab === 'active' ? 'active' : 'inactive';
    const filtered = employees.filter(emp =>
      emp.status === statusFilter &&
      (emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.mobile.includes(searchTerm))
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees, activeTab]);

  const loadEmployees = async () => {
  if (!company?.company_id || !user?.id) return;

  try {
    let query = supabase
      .from<Employee>('employee')
      .select('*')
      .eq('company_id', company.company_id);

    if (role === 'SUPERVISOR') {
      query = query.eq('supervisor_id', user.id);
    }

    const { data, error } = await query;

    if (error) throw error;
    setEmployees(data || []);
    setFilteredEmployees(data || []);
  } catch (err: any) {
    console.error('Error fetching employees:', err.message);
  }
};


  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setDialogOpen(true);
  };

  const handleViewHistory = (employee: Employee) => {
    setSelectedEmployee(employee);
    setHistoryDialogOpen(true);
  };

 const handleDelete = async (employee_id: string) => {
  try {
    const { error } = await supabase
      .from('employee')
      .delete()
      .eq('employee_id', employee_id);
    if (error) throw error;
    await loadEmployees();
  } catch (err: any) {
    alert('Delete failed: ' + err.message);
  }
};

const handleSave = async (payload: EmployeePayload) => {
  if (!company?.company_id || !user?.id) {
    alert("Company or user not loaded yet");
    return;
  }

  // fields that are ALWAYS editable
  const basePayload = {
    full_name: payload.full_name,
    mobile: payload.mobile,
    aadhar: payload.aadhar,
    pan: payload.pan,
    address: payload.address,
    employment_type: payload.employment_type,
    monthly_salary: payload.monthly_salary,
    daily_rate: payload.daily_rate,
    join_date: payload.join_date,
    status: payload.status,
  };

  // ---------------- UPDATE ----------------
  if (editingEmployee?.employee_id) {
    // 🔒 DO NOT touch owner_id / supervisor_id
    const { error } = await supabase
      .from('employee')
      .update(basePayload)
      .eq('employee_id', editingEmployee.employee_id);

    if (error) throw error;
  }

  // ---------------- INSERT ----------------
  else {
    const insertPayload: any = {
      ...basePayload,
      company_id: company.company_id,
    };

    if (role === 'OWNER') {
      insertPayload.owner_id = user.id;
    }

    if (role === 'SUPERVISOR') {
      insertPayload.supervisor_id = user.id;
    }

    const { error } = await supabase
      .from('employee')
      .insert(insertPayload);

    if (error) throw error;
  }

  await loadEmployees();
  setDialogOpen(false);
  setEditingEmployee(null);
};

const exportEmployees = async () => {

  let query = supabase
  .from('employee')
  .select(`
    full_name,
    mobile,
    aadhar,
    pan,
    address,
    city,
    state,
    zipcode,
    employment_type,
    monthly_salary,
    daily_rate,
    join_date,
    status
  `)
  .eq('company_id', company.company_id)
  .order('full_name');

// 🔐 Role-based filtering
if (role === 'SUPERVISOR') {
  query = query.eq('supervisor_id', user.id);
} 

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    toast({
      title: 'No data',
      description: 'No employees found to export',
      variant: 'destructive',
    });
    return;
  }

  exportToExcel(data);
};

const exportToExcel = (employees: any[]) => {
  const formattedData = employees.map(emp => ({
    full_name: emp.full_name,
    mobile: emp.mobile,
    aadhar: emp.aadhar || '',
    pan: emp.pan || '',
    address: emp.address || '',
    city: emp.city || '',
    state: emp.state || '',
    zipcode: emp.zipcode || '',
    employment_type: emp.employment_type,
    monthly_salary: emp.monthly_salary || '',
    daily_rate: emp.daily_rate || '',
    join_date: emp.join_date,
    status: emp.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

 try {
  XLSX.writeFile(
      workbook,
      `employees_${role.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`
    );

     toast({
      title: 'Export Successful 🎉',
      description: `${formattedData.length} employees exported to Excel`,
    });
 } catch (error) {
   toast({
      title: 'Export failed',
      description: error.message || 'Something went wrong',
      variant: 'destructive',
    });
 }
};



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage your workforce</p>
        </div>
        {(role === 'SUPERVISOR' || role === 'OWNER') && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" onClick={exportEmployees}>
              <FileDown className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="active">Active Employees</TabsTrigger>
              <TabsTrigger value="inactive">Past Employees</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <EmployeeTable
                employees={filteredEmployees}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewHistory={handleViewHistory}
                canEdit={role === 'SUPERVISOR' || role === 'OWNER'}
                showHistory={true}
              />
            </TabsContent>
            <TabsContent value="inactive">
              <EmployeeTable
                employees={filteredEmployees}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewHistory={handleViewHistory}
                canEdit={role === 'OWNER' || role === 'SUPERVISOR'}
                showHistory={true}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingEmployee(null);
        }}
        employee={editingEmployee}
        onSave={handleSave}
      />

      <EmployeeHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        employee={selectedEmployee}
      />

      <ExcelImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={loadEmployees}
      />
    </div>
  );
};

export default Employees;
