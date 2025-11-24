import React, { useEffect, useState } from 'react';
import { Employee, EmployeeType } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { supabase } from "@/lib/supabaseClient";

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSave: () => void;
}

const EmployeeDialog: React.FC<EmployeeDialogProps> = ({
  open,
  onOpenChange,
  employee,
  onSave,
}) => {
  const [formData, setFormData] = useState({
  employee_id: null,
  name: '',
  mobile: '',
  aadhar: '',
  pan: '',
  address: '',
  type: 'FIXED',
  salary: 0,
  dailyRate: 0,
  supervisorId: '',        // added
  joinDate: '',            // added
  status: 'active',        // added
  company_id: '',
});


  useEffect(() => {
  if (employee) {
    setFormData({
      employee_id: employee.employee_id,
      name: employee.name,
      mobile: employee.mobile || "",
      address: employee.address || "",
      aadhar: employee.aadhar || "",
      pan: employee.pan || "",
      type: employee.type,
      salary: employee.salary || 0,
      dailyRate: employee.dailyRate || 0,
      supervisorId: employee.supervisorId || "",
      joinDate: employee.joinDate,
      status: employee.status,
      company_id: employee.companyId,
    });
  } else {
    setFormData({
      employee_id: null,
      name: '',
      mobile: '',
      aadhar: '',
      pan: '',
      address: '',
      type: 'FIXED',
      salary: 0,
      dailyRate: 0,
      supervisorId: '',
      joinDate: '',
      status: 'active',
      company_id: '',
    });
  }
}, [employee, open]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
  full_name: formData.name,
  aadhar: formData.aadhar,
  pan: formData.pan,
  employment_type: formData.type,
  monthly_salary: formData.type === "FIXED" ? formData.salary : null,
  daily_rate: formData.type === "DAILY" ? formData.dailyRate : null,
  supervisor_id: formData.supervisorId,
  join_date: formData.joinDate,
  status: formData.status,
  company_id: formData.company_id,
  mobile: formData.mobile,
  address: formData.address,
};


    try {
      if (employee?.employee_id) {
        // UPDATE
        const { error } = await supabase
          .from("employee")
          .update(payload)
          .eq("employee_id", employee.employee_id);

        if (error) throw error;

      } else {
        // INSERT
        const { error } = await supabase
          .from("employee")
          .insert([payload]);

        if (error) throw error;
      }

      onSave();
      onOpenChange(false);

    } catch (err: any) {
      alert("Supabase Error: " + err.message);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {employee ? 'Update employee information' : 'Fill in the details to add a new employee'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Mobile *</Label>
              <Input
                value={formData.mobile}
                onChange={(e) => handleChange('mobile', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Aadhar</Label>
              <Input
                value={formData.aadhar}
                onChange={(e) => handleChange('aadhar', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>PAN</Label>
              <Input
                value={formData.pan}
                onChange={(e) => handleChange('pan', e.target.value)}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Employment Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => handleChange('type', value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">Fixed Salary</SelectItem>
                  <SelectItem value="DAILY">Daily Wage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'FIXED' ? (
              <div className="space-y-2">
                <Label>Monthly Salary *</Label>
                <Input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => handleChange('salary', parseFloat(e.target.value))}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Daily Rate *</Label>
                <Input
                  type="number"
                  value={formData.dailyRate}
                  onChange={(e) => handleChange('dailyRate', parseFloat(e.target.value))}
                />
              </div>
            )}

          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {employee ? 'Update' : 'Add'} Employee
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDialog;
