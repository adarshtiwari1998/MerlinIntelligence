
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        toast({
          title: "Reset link sent",
          description: "Please check your email for the password reset link"
        });
      } else {
        throw new Error('Failed to send reset link');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send reset link. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Reset password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            We'll email you a password reset link.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <Input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button 
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Start password reset'}
          </Button>
          <div className="text-center">
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500"
              onClick={() => navigate('/login')}
            >
              Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
