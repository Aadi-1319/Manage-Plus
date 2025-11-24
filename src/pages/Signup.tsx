import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import GoogleSignInButton from "@/components/ui/google-sign-in-button";

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fullName && formData.email && formData.password) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signup(
        formData.email,
        formData.password,
        formData.fullName,
        formData.companyName,
        {
          gstNo: formData.gstNo,
          address: formData.address,
        }
      );
      toast({
        title: 'Account created!',
        description: 'Your company has been registered successfully.',
      });
      navigate('/dashboard');
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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // TODO: Implement Google Sign-in logic here
      // For now, just show a success message
      toast({
        title: "Success!",
        description: "You have successfully signed in with Google.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            {step === 1 
              ? 'Enter your account details to get started' 
              : 'Tell us about your company'}
          </CardDescription>
          <div className="flex gap-2 mt-4">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </CardHeader>
        <CardContent>
           <GoogleSignInButton
              onClick={handleGoogleSignIn}
              isLoading={isGoogleLoading}
            />
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Your Company Ltd."
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
                  placeholder="Company address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleBack} className="w-full">
                  Back
                </Button>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create account'}
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
