import React, { useEffect, useState } from 'react';
import { Supervisor} from '@/types';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface SupervisorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supervisor: Supervisor | null;
  onSave: (supervisor: Partial<Supervisor>) => void;
}

const SupervisorDialog: React.FC<SupervisorDialogProps> = ({
  open,
  supervisor,
  onOpenChange,
  onSave,
}) => {
  const [formData, setFormData] = useState({
  fullName: '',
  email: '',
  phone: '',
  aadhar: '',
  pan: '',
  address: '',
});

const [errors, setErrors] = useState<{
  fullName?: string;
  email?: string;
  phone?: string;
  aadhar?: string;
  pan?: string;
  address?: string;
}>({});

const [loading,setLoading] = useState(false);



  useEffect(() => {
  if (supervisor) {
    setFormData({
      fullName: supervisor.fullName,
      address: supervisor.address || "",
      aadhar: supervisor.aadhar || "",
      pan: supervisor.pan || "",
      email: supervisor.email,
      phone: supervisor.phone || "",
    });
  } else {
    setFormData({
      fullName: '',
      phone: '',
      aadhar: '',
      pan: '',
      address: '',
      email: '',});
  }
}, [supervisor, open]);

  const { toast } = useToast();

  const validateForm = () => {
  const newErrors: typeof errors = {};

  if (!formData.fullName.trim()) {
    newErrors.fullName = 'Full name is required';
  }

  if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
    newErrors.email = 'Enter a valid email address';
  }

  if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) {
    newErrors.phone = 'Enter valid 10-digit mobile number';
  }

  if (formData.aadhar && !/^\d{12}$/.test(formData.aadhar)) {
    newErrors.aadhar = 'Aadhar must be 12 digits';
  }

  if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.pan)) {
    newErrors.pan = 'Invalid PAN format';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  setLoading(true);

  try {
    await onSave(formData);
    setFormData({ fullName: '', email: '', phone: '', aadhar: '', pan: '', address: '' });
    toast({
      title: 'Supervisor added',
      description: 'The supervisor has been added successfully.',
    });
  } catch (error) {
    toast({
      title: 'Error',
      description:
        error instanceof Error ? error.message : 'Failed to add supervisor',
      variant: 'destructive',
    });
  } finally{
    setLoading(false);
  }
};


  const handleChange = (field: string, value: string) => {
  const formattedValue =
    field === 'phone'
      ? value.replace(/\D/g, '').slice(0, 10)
      : field === 'aadhar'
      ? value.replace(/\D/g, '').slice(0, 12)
      : field === 'pan'
      ? value.toUpperCase()
      : value;

  setFormData(prev => ({ ...prev, [field]: formattedValue }));
  setErrors(prev => ({ ...prev, [field]: undefined }));
};


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Supervisor</DialogTitle>
          <DialogDescription>
            Create a new supervisor account for your company
          </DialogDescription>
        </DialogHeader>

       <form onSubmit={handleSubmit} className="space-y-4">

  {/* Full Name */}
  <div className="space-y-1">
    <Label>Full Name</Label>
    <Input
      value={formData.fullName}
      onChange={(e) => handleChange('fullName', e.target.value)}
    />
    {errors.fullName && (
      <p className="text-sm text-red-500">{errors.fullName}</p>
    )}
  </div>

  {/* Email */}
  <div className="space-y-1">
    <Label>Email</Label>
    <Input
      type="email"
      value={formData.email}
      onChange={(e) => handleChange('email', e.target.value)}
    />
    {errors.email && (
      <p className="text-sm text-red-500">{errors.email}</p>
    )}
  </div>

  {/* Phone */}
  <div className="space-y-1">
    <Label>Phone Number</Label>
    <Input
      value={formData.phone}
      onChange={(e) => handleChange('phone', e.target.value)}
      maxLength={10}
      placeholder="10-digit mobile number"
    />
    {errors.phone && (
      <p className="text-sm text-red-500">{errors.phone}</p>
    )}
  </div>

  {/* Aadhar */}
  <div className="space-y-1">
    <Label>Aadhar Number</Label>
    <Input
      value={formData.aadhar}
      onChange={(e) => handleChange('aadhar', e.target.value)}
      maxLength={12}
    />
    {errors.aadhar && (
      <p className="text-sm text-red-500">{errors.aadhar}</p>
    )}
  </div>

  {/* PAN */}
  <div className="space-y-1">
    <Label>PAN Number</Label>
    <Input
      value={formData.pan}
      onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
      maxLength={10}
    />
    {errors.pan && (
      <p className="text-sm text-red-500">{errors.pan}</p>
    )}
  </div>

  {/* Address */}
  <div className="space-y-2">
    <Label>Address</Label>
    <Textarea
      value={formData.address}
      onChange={(e) => handleChange('address', e.target.value)}
      rows={3}
    />
  </div>

  <DialogFooter>
    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
      Cancel
    </Button>
    <Button type="submit" disabled={loading}>
      {loading ? 'Loading... ' : supervisor ? 'Update' : 'Add'} supervisor
    </Button>
  </DialogFooter>

</form>

      </DialogContent>
    </Dialog>
  );
};

export default SupervisorDialog;
