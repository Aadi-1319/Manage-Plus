import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";

import { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, FileDown, Upload } from 'lucide-react';
import EmployeeTable from '@/components/Employees/EmployeeTable';
import EmployeeDialog from '@/components/Employees/EmployeeDialog';
import EmployeeHistoryDialog from '@/components/Employees/EmployeeHistoryDialog';
import ExcelImportDialog from '@/components/Employees/ExcelImportDialog';

const Employees: React.FC = () => {
  const { company, user } = useAuth();
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
      (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.mobile.includes(searchTerm))
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees, activeTab]);

  const loadEmployees = () => {
    const allEmployees: Employee[] = JSON.parse(localStorage.getItem('employees') || '[]');
    let companyEmployees = allEmployees.filter(e => e.companyId === company?.id);
    
    if (user?.role === 'SUPERVISOR') {
      companyEmployees = companyEmployees.filter(e => e.supervisorId === user.id);
    }
    
    setEmployees(companyEmployees);
    setFilteredEmployees(companyEmployees);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setDialogOpen(true);
  };

  const handleViewHistory = (employee: Employee) => {
    setSelectedEmployee(employee);
    setHistoryDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const allEmployees: Employee[] = JSON.parse(localStorage.getItem('employees') || '[]');
    const updated = allEmployees.filter(e => e.id !== id);
    localStorage.setItem('employees', JSON.stringify(updated));
    loadEmployees();
  };

  const handleSave = (employee: Partial<Employee>) => {
    const allEmployees: Employee[] = JSON.parse(localStorage.getItem('employees') || '[]');
    
    if (editingEmployee) {
      const updated = allEmployees.map(e =>
        e.id === editingEmployee.id ? { ...e, ...employee } : e
      );
      localStorage.setItem('employees', JSON.stringify(updated));
    } else {
      const newEmployee: Employee = {
        id: `emp_${Date.now()}`,
        companyId: company!.id,
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
        ...employee as Omit<Employee, 'id' | 'companyId' | 'status' | 'joinDate'>,
      };
      allEmployees.push(newEmployee);
      localStorage.setItem('employees', JSON.stringify(allEmployees));
    }
    
    loadEmployees();
    setDialogOpen(false);
    setEditingEmployee(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage your workforce</p>
        </div>
        {user?.role === 'OWNER' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline">
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
                canEdit={user?.role === 'OWNER'}
                showHistory={false}
              />
            </TabsContent>
            <TabsContent value="inactive">
              <EmployeeTable
                employees={filteredEmployees}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewHistory={handleViewHistory}
                canEdit={user?.role === 'OWNER'}
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
