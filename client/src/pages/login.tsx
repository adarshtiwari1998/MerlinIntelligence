
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = await login(email, password);
      if (success) {
        // Check if user is verified
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (!data.user?.verified) {
          toast({
            title: "Email verification required",
            description: "Please verify your email to continue",
          });
          setLocation('/verify?goto=%2F~');
          return;
        }

        toast({
          title: "Welcome back!",
          description: "Successfully logged in. Redirecting to chat...",
        });
        setTimeout(() => setLocation('/chat'), 500);
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again or reset your password.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full"
          >
            Sign in
          </Button>
          
          <div className="text-center space-y-2">
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500 block w-full"
              onClick={() => setLocation('/sign-up')}
            >
              Don't have an account? Register
            </button>
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500 block w-full"
              onClick={() => setLocation('/forget')}
            >
              Forgot your password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
