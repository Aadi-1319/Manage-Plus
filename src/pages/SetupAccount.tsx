import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SetupAccount: React.FC = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ STEP 1: Trust Supabase session after redirect
  useEffect(() => {
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.user) {
        setError('Invite link expired or already used');
        return;
      }

      setUserId(data.session.user.id);
    };

    loadSession();
  }, []);

  const handleSetup = async () => {
    if (!userId) {
      setError('Invalid session');
      return;
    }

    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    // ✅ STEP 2: Set password
    const { error: authError } = await supabase.auth.updateUser({
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // ✅ STEP 3: Activate supervisor
    const { error: dbError } = await supabase
      .from('supervisor')
      .update({ status: 'ACTIVE' })
      .eq('supervisor_id', userId);

    if (dbError) {
      setError('Failed to activate supervisor');
      setLoading(false);
      return;
    }

    // ✅ STEP 4: Redirect
    navigate('/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set Your Password</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSetup}
            disabled={loading || !userId}
          >
            {loading ? 'Setting up...' : 'Create Account'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupAccount;
