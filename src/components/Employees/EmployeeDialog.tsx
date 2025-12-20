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
const [errors, setErrors] = useState<Record<string, string>>({});




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


const validateForm = () => {
  const errors: Record<string, string> = {};

  if (!formData.full_name.trim()) {
    errors.full_name = 'Full name is required';
  }

  if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
    errors.mobile = 'Enter valid 10-digit mobile number';
  }

  if (formData.aadhar && !/^\d{12}$/.test(formData.aadhar)) {
    errors.aadhar = 'Aadhar must be 12 digits';
  }

  if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.pan)) {
    errors.pan = 'Invalid PAN format';
  }

  if (!formData.joinDate) {
    errors.joinDate = 'Join date is required';
  }

  if (!formData.employment_type) {
    errors.employment_type = 'Employment type is required';
  }

  if (
    formData.employment_type === 'FIXED' &&
    (!formData.salary || formData.salary <= 0)
  ) {
    errors.salary = 'Monthly salary is required';
  }

  if (
    formData.employment_type === 'DAILY' &&
    (!formData.dailyRate || formData.dailyRate <= 0)
  ) {
    errors.dailyRate = 'Daily rate is required';
  }

  setErrors(errors);
  return Object.keys(errors).length === 0;
};


  const handleSubmit = async (e: React.FormEvent) => {
    
  e.preventDefault();

   if (!validateForm()) return;

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


  const handleChange = (key: string, value: any) => {
  setFormData(prev => ({
    ...prev,
    [key]:
      key === 'pan' ? value.toUpperCase() :
      key === 'aadhar' ? value.replace(/\D/g, '').slice(0, 12) :
      value,
  }));

  setErrors(prev => ({ ...prev, [key]: undefined }));
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

    {/* Full Name */}
    <div className="space-y-1">
      <Label>Full Name *</Label>
      <Input
        value={formData.full_name}
        onChange={(e) => handleChange('full_name', e.target.value)}
        className={errors.full_name ? 'border-red-500' : ''}
      />
      {errors.full_name && <p className="text-xs text-red-500">{errors.full_name}</p>}
    </div>

    {/* Mobile */}
    <div className="space-y-1">
      <Label>Mobile *</Label>
      <Input
        value={formData.mobile}
        onChange={(e) => handleChange('mobile', e.target.value)}
        className={errors.mobile ? 'border-red-500' : ''}
      />
      {errors.mobile && <p className="text-xs text-red-500">{errors.mobile}</p>}
    </div>

    {/* Aadhar */}
    <div className="space-y-1">
      <Label>Aadhar</Label>
      <Input
        value={formData.aadhar}
        onChange={(e) => handleChange('aadhar', e.target.value)}
        className={errors.aadhar ? 'border-red-500' : ''}
      />
      {errors.aadhar && <p className="text-xs text-red-500">{errors.aadhar}</p>}
    </div>

    {/* PAN */}
    <div className="space-y-1">
      <Label>PAN</Label>
      <Input
        value={formData.pan}
        onChange={(e) => handleChange('pan', e.target.value)}
        className={errors.pan ? 'border-red-500' : ''}
      />
      {errors.pan && <p className="text-xs text-red-500">{errors.pan}</p>}
    </div>

    {/* Address */}
    <div className="space-y-1 col-span-2">
      <Label>Address</Label>
      <Input
        value={formData.address}
        onChange={(e) => handleChange('address', e.target.value)}
      />
    </div>

    {/* Join Date */}
    <div className="space-y-1">
      <Label>Join Date *</Label>
      <Input
        type="date"
        value={formData.joinDate}
        onChange={(e) => handleChange('joinDate', e.target.value)}
        className={errors.joinDate ? 'border-red-500' : ''}
      />
      {errors.joinDate && <p className="text-xs text-red-500">{errors.joinDate}</p>}
    </div>

    {/* Status */}
    <div className="space-y-1">
      <Label>Status</Label>
      <Select
        value={formData.status}
        onValueChange={(v) => handleChange('status', v)}
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Employment Type */}
    <div className="space-y-1">
      <Label>Employment Type *</Label>
      <Select
        value={formData.employment_type}
        onValueChange={(v) => handleChange('employment_type', v)}
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="FIXED">Fixed Salary</SelectItem>
          <SelectItem value="DAILY">Daily Wage</SelectItem>
        </SelectContent>
      </Select>
      {errors.employment_type && (
        <p className="text-xs text-red-500">{errors.employment_type}</p>
      )}
    </div>

    {/* Salary / Daily */}
    {formData.employment_type === 'FIXED' ? (
      <div className="space-y-1">
        <Label>Monthly Salary *</Label>
        <Input
          type="number"
          value={formData.salary}
          onChange={(e) => handleChange('salary', Number(e.target.value))}
          className={errors.salary ? 'border-red-500' : ''}
        />
        {errors.salary && <p className="text-xs text-red-500">{errors.salary}</p>}
      </div>
    ) : (
      <div className="space-y-1">
        <Label>Daily Rate *</Label>
        <Input
          type="number"
          value={formData.dailyRate}
          onChange={(e) => handleChange('dailyRate', Number(e.target.value))}
          className={errors.dailyRate ? 'border-red-500' : ''}
        />
        {errors.dailyRate && <p className="text-xs text-red-500">{errors.dailyRate}</p>}
      </div>
    )}
  </div>

  <DialogFooter>
    <Button type="button" variant="outline">Cancel</Button>
    <Button type="submit">Save Employee</Button>
  </DialogFooter>
</form>

      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDialog;
