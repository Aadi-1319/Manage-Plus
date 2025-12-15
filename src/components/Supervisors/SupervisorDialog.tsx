import React, { useState } from 'react';
import { User } from '@/types';
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
  onSave: (supervisor: Partial<User>) => void;
}

const SupervisorDialog: React.FC<SupervisorDialogProps> = ({
  open,
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

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
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
  }
};


  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
           <Label htmlFor="phone">Phone Number</Label>
           <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
          </div>


          <div className="space-y-2">
            <Label htmlFor="aadhar">Aadhar Number</Label>
            <Input
              id="aadhar"
              value={formData.aadhar}
              onChange={(e) => handleChange('aadhar', e.target.value)}
              placeholder="12 digit Aadhar number"
              maxLength={12}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pan">PAN Number</Label>
            <Input
              id="pan"
              value={formData.pan}
              onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
              placeholder="10 character PAN"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Complete address"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Supervisor</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupervisorDialog;
