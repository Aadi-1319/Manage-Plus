import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GoogleSignInButton from "@/components/ui/google-sign-in-button";
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/lib/supabaseClient";



const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login,setCompany } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

 // 🔥 LOGIN PAGE (ALL INSERT LOGIC HERE)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const emailClean = email.trim().toLowerCase();
    const passwordClean = password;

    // 1️⃣ LOGIN FIRST
    const loggedUser = await login(emailClean, passwordClean);

    // 2️⃣ CHECK EMAIL VERIFIED
    if (!loggedUser.email_confirmed_at) {
  toast({
    title: "Verify your email",
    description: "Please verify your email before logging in."
  });
  setLoading(false);
  return;
}


    // 3️⃣ CHECK IF OWNER ALREADY EXISTS
    const { data: existingOwner } = await supabase
      .from("owner")
      .select("*")
      .eq("owner_id", loggedUser.id)
      .maybeSingle();

    if (existingOwner) {
      toast({
        title: "Welcome back!",
        description: "Login successful!",
      });
      navigate("/dashboard");
      return;
    }

    // 4️⃣ FIRST LOGIN → INSERT COMPANY + OWNER
    const meta = loggedUser.user_metadata;

    // Insert Company
    const { data: company, error: compErr } = await supabase
      .from("company")
      .insert({
        company_name: meta.companyName,
        gst_no: meta.gstNo || null,
        address: meta.address || null,
      })
      .select()
      .single();

    if (compErr) throw compErr;



    // Insert Owner
    const { error: ownerErr } = await supabase
      .from("owner")
      .insert({
        owner_id: loggedUser.id,
        company_id: company.company_id,
        full_name: meta.fullName,
        email: loggedUser.email,
        phone: meta.phone || null,
      });

    if (ownerErr) throw ownerErr;

    setCompany(company);

    toast({
      title: "Registration Completed",
      description: "Your company and owner profile has been created!",
    });

    navigate("/dashboard");

  } catch (error) {
    toast({
      title: "Login failed",
      description: error instanceof Error ? error.message : "Invalid credentials or System Error",
      variant: "destructive",
    });
  }

  setLoading(false);
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
