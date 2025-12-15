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
import { useAuth } from '@/hooks/useAuth';

export type EmployeePayload = {
  full_name: string;
  mobile: string;
  aadhar?: string | null;
  pan?: string | null;
  address?: string | null;

  employment_type: 'FIXED' | 'DAILY';
  monthly_salary?: number | null;
  daily_rate?: number | null;

  join_date?: string | null;
  status: 'active' | 'inactive';

  company_id: string;          // uuid
  supervisor_id?: string | null; // uuid | null
};



interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSave: (data: EmployeePayload) => void; // ✅ accepts data
}

const EmployeeDialog: React.FC<EmployeeDialogProps> = ({
  
  open,
  onOpenChange,
  employee,
  onSave,
}) => {
  const [formData, setFormData] = useState({
  full_name: '',
  mobile: '',
  aadhar: '',
  pan: '',
  address: '',
  employment_type: 'FIXED' as 'FIXED' | 'DAILY',
  salary: 0,
  dailyRate: 0,
  joinDate: '',            // added
  status: 'active' as 'active' | 'inactive',        // added
});

const { company, user ,role} = useAuth();



  useEffect(() => {
  if (employee) {
    setFormData({
      full_name: employee.full_name,
      mobile: employee.mobile || "",
      address: employee.address || "",
      aadhar: employee.aadhar || "",
      pan: employee.pan || "",
      employment_type: employee.employment_type,
      salary: employee.monthly_salary || 0,
      dailyRate: employee.daily_rate || 0,
      joinDate: employee.join_date,
      status: employee.status,
    });
  } else {
    setFormData({
      full_name: '',
      mobile: '',
      aadhar: '',
      pan: '',
      address: '',
      employment_type: 'FIXED',
      salary: 0,
      dailyRate: 0,
      joinDate: '',
      status: 'active',
    });
  }
}, [employee, open]);


  const handleSubmit = async (e: React.FormEvent) => {
    
  e.preventDefault();

  console.log(user,company,role);
  if (!company?.company_id || !user?.id) {
    alert("Company or user not loaded yet");
    return;
  }

  const payload :EmployeePayload= {
    full_name: formData.full_name,
    aadhar: formData.aadhar,
    pan: formData.pan,
    employment_type: formData.employment_type,
    monthly_salary: formData.employment_type === "FIXED" ? formData.salary : null,
    daily_rate: formData.employment_type === "DAILY" ? formData.dailyRate : null,
    supervisor_id: role === "SUPERVISOR" ? user.id :  null,
    join_date: formData.joinDate,
    status: formData.status,
    company_id: company.company_id,
    mobile: formData.mobile,
    address: formData.address,
  };

    onSave(payload);
    onOpenChange(false);
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
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
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
  <Label>Join Date *</Label>
  <Input
    type="date"
    value={formData.joinDate}
    onChange={(e) => handleChange('joinDate', e.target.value)}
    required
  />
</div>


<div className="space-y-2">
  <Label>Status</Label>
  <Select
    value={formData.status}
    onValueChange={(value) => handleChange('status', value)}
  >
    <SelectTrigger><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="inactive">Inactive</SelectItem>
    </SelectContent>
  </Select>
</div>


            <div className="space-y-2">
              <Label>Employment Type *</Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value: any) => handleChange('type', value as 'FIXED' | 'DAILY')}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">Fixed Salary</SelectItem>
                  <SelectItem value="DAILY">Daily Wage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.employment_type === 'FIXED' ? (
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
                  value={formData.dailyRate | formData.salary}
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
