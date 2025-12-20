import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Signup: React.FC = () => {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    companyName: '',
    gstNo: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Step 1 → Step 2
  const handleNext = (e: React.FormEvent) => {
  e.preventDefault();
  if (validateStep1()) {
    setStep(2);
    setErrors({});
  }
};

const handleBack = () => {
  setStep(1);
  setErrors({});
};

  const validateStep1 = () => {
  const newErrors: Record<string, string> = {};

  if (!formData.fullName.trim()) {
    newErrors.fullName = 'Full name is required';
  }

  if (!formData.phone.trim()) {
    newErrors.phone = 'Phone number is required';
  } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
    newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
  }

  if (!formData.email.trim()) {
    newErrors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Enter a valid email address';
  }

  if (!formData.password.trim()) {
    newErrors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    newErrors.password = 'Password must be at least 6 characters';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const validateStep2 = () => {
  const newErrors: Record<string, string> = {};

  if (!formData.companyName.trim()) {
    newErrors.companyName = 'Company name is required';
  }

  if (formData.gstNo && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNo)) {
    newErrors.gstNo = 'Invalid GST number format';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


  // Final submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setLoading(true);

    try {
      await signup(
        formData.email,
        formData.password,
        {
          fullName: formData.fullName,
          phone: formData.phone,
          companyName: formData.companyName,
          gstNo: formData.gstNo,
          address: formData.address,
          role: "owner"
        }
      );

      // toast({
      //   title: 'Account created!',
      //   description: 'Your company has been registered successfully.',
      // });

      // navigate('/login');

    } catch (error) {
      toast({
        title: 'Signup failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { id, value } = e.target;

  setFormData(prev => ({
    ...prev,
    [id]: id === 'gstNo' ? value.toUpperCase() : value,
  }));

  // Optional: clear error as user types
  setErrors(prev => ({
    ...prev,
    [id]: undefined,
  }));
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            {step === 1 ? 'Enter your details to get started' : 'Tell us about your company'}
          </CardDescription>

          {/* Step progress bar */}
          <div className="flex gap-2 mt-4">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </CardHeader>

        <CardContent>
          {/* STEP 1 */}
          {step === 1 ? (
           <form onSubmit={handleNext} className="space-y-4">
  {/* Full Name */}
  <div className="space-y-1">
    <Label htmlFor="fullName">Full Name</Label>
    <Input
      id="fullName"
      value={formData.fullName}
      onChange={handleChange}
      className={errors.fullName ? 'border-red-500' : ''}
      placeholder="John Doe"
    />
    {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
  </div>

  {/* Phone */}
  <div className="space-y-1">
    <Label htmlFor="phone">Phone</Label>
    <Input
      id="phone"
      value={formData.phone}
      onChange={handleChange}
      className={errors.phone ? 'border-red-500' : ''}
      placeholder="9876543210"
    />
    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
  </div>

  {/* Email */}
  <div className="space-y-1">
    <Label htmlFor="email">Email</Label>
    <Input
      id="email"
      type="email"
      value={formData.email}
      onChange={handleChange}
      className={errors.email ? 'border-red-500' : ''}
      placeholder="name@example.com"
    />
    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
  </div>

  {/* Password */}
  <div className="space-y-1">
    <Label htmlFor="password">Password</Label>
    <Input
      id="password"
      type="password"
      value={formData.password}
      onChange={handleChange}
      className={errors.password ? 'border-red-500' : ''}
      placeholder="••••••••"
    />
    {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
  </div>

  <Button className="w-full" type="submit">Next</Button>
</form>

          ) : (
            /* STEP 2 */
            <form onSubmit={handleSubmit} className="space-y-4">
  <div className="space-y-1">
    <Label htmlFor="companyName">Company Name</Label>
    <Input
      id="companyName"
      value={formData.companyName}
      onChange={handleChange}
      className={errors.companyName ? 'border-red-500' : ''}
      placeholder="Your Company Pvt Ltd"
    />
    {errors.companyName && <p className="text-xs text-red-500">{errors.companyName}</p>}
  </div>

  <div className="space-y-1">
    <Label htmlFor="gstNo">GST Number (Optional)</Label>
    <Input
      id="gstNo"
      value={formData.gstNo}
      onChange={handleChange}
      className={errors.gstNo ? 'border-red-500' : ''}
      placeholder="22AAAAA0000A1Z5"
    />
    {errors.gstNo && <p className="text-xs text-red-500">{errors.gstNo}</p>}
  </div>

  <div className="space-y-2">
    <Label htmlFor="address">Address (Optional)</Label>
    <Input
      id="address"
      value={formData.address}
      onChange={handleChange}
      placeholder="Company Address"
    />
  </div>

  <div className="flex gap-2">
    <Button variant="outline" type="button" onClick={handleBack} className="w-full">
      Back
    </Button>
    <Button type="submit" className="w-full" disabled={loading}>
      {loading ? 'Creating...' : 'Create Account'}
    </Button>
  </div>
</form>

          )}

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
