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

// ✅ Import Supabase directly here
import { supabase } from "@/lib/supabaseClient";

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSave: () => void; // we update this
}

const EmployeeDialog: React.FC<EmployeeDialogProps> = ({
  open,
  onOpenChange,
  employee,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    mobile: '',
    aadhar: '',
    pan: '',
    address: '',
    type: 'FIXED',
    salary: 0,
    dailyRate: 0,
  });

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    } else {
      setFormData({
        name: '',
        mobile: '',
        aadhar: '',
        pan: '',
        address: '',
        type: 'FIXED',
        salary: 0,
        dailyRate: 0,
      });
    }
  }, [employee, open]);

  // ✅ Supabase insert/update happens here
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave = {
      ...formData,
      salary: formData.type === "FIXED" ? formData.salary : null,
      dailyRate: formData.type === "DAILY" ? formData.dailyRate : null,
    };

    try {
      if (employee?.id) {
        // ✅ Update employee
        const { error } = await supabase
          .from("employee")
          .update(dataToSave)
          .eq("id", employee.id);

        if (error) throw error;
      } else {
        // ✅ Insert employee
        const { error } = await supabase
          .from("employee")
          .insert([dataToSave]);

        if (error) throw error;
      }

      onSave();            // refresh parent list
      onOpenChange(false); // close dialog

    } catch (err: any) {
      alert("Supabase Error: " + err.message);
    }
  };

  const handleChange = (field: keyof Employee, value: any) => {
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
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile *</Label>
              <Input
                id="mobile"
                value={formData.mobile}
                onChange={(e) => handleChange('mobile', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aadhar">Aadhar Number</Label>
              <Input
                id="aadhar"
                value={formData.aadhar}
                onChange={(e) => handleChange('aadhar', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pan">PAN Number</Label>
              <Input
                id="pan"
                value={formData.pan}
                onChange={(e) => handleChange('pan', e.target.value)}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Employment Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: EmployeeType) =>
                  handleChange('type', value)
                }
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
                <Label htmlFor="salary">Monthly Salary (₹) *</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => handleChange('salary', parseInt(e.target.value))}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="dailyRate">Daily Rate (₹) *</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  value={formData.dailyRate}
                  onChange={(e) => handleChange('dailyRate', parseInt(e.target.value))}
                  required
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
