
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';

export default function ActionCode() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('oobCode');
    const mode = params.get('mode');

    if (token && mode === 'verifyEmail') {
      verifyEmail(token);
    }
  }, [location.search]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oobCode: token })
      });

      if (response.ok) {
        setVerificationStatus('success');
        toast({
          title: "Email verified",
          description: "Verification successful! Redirecting to chat..."
        });
        setTimeout(() => navigate('/chat'), 1500);
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      setVerificationStatus('error');
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "Please try again or request a new verification email"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {verificationStatus === 'success' ? (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">Email Verified Successfully!</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Redirecting to chat...</p>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Verifying your email...</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Please wait while we verify your email address.</p>
          </div>
        )}
      </div>
    </div>
  );
}
