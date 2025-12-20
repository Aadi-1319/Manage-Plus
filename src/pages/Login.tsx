import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import GoogleSignInButton from "@/components/ui/google-sign-in-button";


const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);


  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  
const validate = () => {
  const newErrors: { email?: string; password?: string } = {};

  // Email validation
  if (!email.trim()) {
    newErrors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    newErrors.email = 'Enter a valid email address';
  }

  // Password validation
  if (!password.trim()) {
    newErrors.password = 'Password is required';
  } else if (password.length < 6) {
    newErrors.password = 'Password must be at least 6 characters';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      await login(email, password);

      toast({
        title: "Welcome!",
        description: "Login successful",
      });

      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
           <GoogleSignInButton
              onClick={handleGoogleSignIn}
              isLoading={isGoogleLoading}
            />
          <form onSubmit={handleSubmit} className="space-y-4">
  {/* Email */}
  <div className="space-y-1">
    <Label htmlFor="email">Email</Label>
    <Input
      id="email"
      type="email"
      placeholder="name@example.com"
      value={email}
      onChange={(e) => {
        setEmail(e.target.value);
        setErrors(prev => ({ ...prev, email: undefined }));
      }}
      className={errors.email ? 'border-red-500' : ''}
    />
    {errors.email && (
      <p className="text-xs text-red-500">{errors.email}</p>
    )}
  </div>

  {/* Password */}
  <div className="space-y-1">
    <Label htmlFor="password">Password</Label>
    <Input
      id="password"
      type="password"
      placeholder="Enter your password"
      value={password}
      onChange={(e) => {
        setPassword(e.target.value);
        setErrors(prev => ({ ...prev, password: undefined }));
      }}
      className={errors.password ? 'border-red-500' : ''}
    />
    {errors.password && (
      <p className="text-xs text-red-500">{errors.password}</p>
    )}
  </div>

  <Button type="submit" className="w-full" disabled={loading}>
    {loading ? 'Signing in...' : 'Sign in'}
  </Button>
</form>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
