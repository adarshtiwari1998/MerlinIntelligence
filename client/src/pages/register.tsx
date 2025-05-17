
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('verificationEmail', email);
      sessionStorage.setItem('lastPage', '/sign-up');
      
      toast({
        title: "Verification email sent",
        description: "Please check your email and enter the verification code"
      });
      
      navigate('/verify');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      if (response.ok) {
        toast({
          title: "Email verified",
          description: "Registration complete! Redirecting to chat..."
        });
        navigate('/chat');
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "Invalid verification code. Please try again."
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Create your account
          </h2>
        </div>
        
        {verifying ? (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-medium">Enter verification code</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We've sent a code to {email}
              </p>
            </div>
            <div className="flex justify-center">
              <InputOTP
                value={otp}
                onChange={setOtp}
                maxLength={6}
                render={({ slots }) => (
                  <InputOTPGroup>
                    {slots.map((slot, index) => (
                      <InputOTPSlot key={index} {...slot} />
                    ))}
                  </InputOTPGroup>
                )}
              />
            </div>
            <Button 
              onClick={handleVerify}
              className="w-full"
            >
              Verify Email
            </Button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <Input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="text"
                required
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button 
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
            
            <div className="text-center">
              <button
                type="button"
                className="text-blue-600 hover:text-blue-500"
                onClick={() => navigate('/login')}
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
