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
    companyName: '',
    gstNo: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Next button (Form Step 1 → Step 2)
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fullName && formData.email && formData.password) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  // FINAL SUBMIT (Creates User + Company + Owner)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signup(
        formData.email,
        formData.password,
        {
          fullName: formData.fullName,
          companyName: formData.companyName,
          gstNo: formData.gstNo,
          address: formData.address,
          role: "owner"
        }
      );

      toast({
        title: 'Account created!',
        description: 'Your company has been registered successfully.',
      });

      navigate('/login');  // redirect to login
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
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            {step === 1 
              ? 'Enter your details to get started'
              : 'Tell us about your company'}
          </CardDescription>

          {/* Progress Bar */}
          <div className="flex gap-2 mt-4">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </CardHeader>

        <CardContent>
          {/* STEP 1 — User info */}
          {step === 1 ? (
            <form onSubmit={handleNext} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full">
                Next
              </Button>
            </form>
          ) : (
            // STEP 2 — Company info
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name (Required)</Label>
                <Input
                  id="companyName"
                  placeholder="Your Company Pvt Ltd."
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstNo">GST Number (Optional)</Label>
                <Input
                  id="gstNo"
                  placeholder="22AAAAA0000A1Z5"
                  value={formData.gstNo}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  placeholder="Company Address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleBack} className="w-full">
                  Back
                </Button>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
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
