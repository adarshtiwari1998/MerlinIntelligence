
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function Verify() {
  const [email, setEmail] = useState('');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    // Get email from storage
    const storedEmail = localStorage.getItem('verificationEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }

    // Get verification params from URL
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const code = params.get('code');

    if (mode === 'verifyEmail' && code) {
      verifyEmail(code);
    }
  }, []);

  const verifyEmail = async (code: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code })
      });

      const data = await response.json();
      
      if (response.ok) {
        setVerificationStatus('success');
        toast({
          title: "Email verified",
          description: "Verification successful! Redirecting to chat..."
        });
        localStorage.removeItem('verificationEmail');
        setTimeout(() => navigate('/chat'), 1500);
      } else {
        setVerificationStatus('error');
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      setVerificationStatus('error');
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "Invalid or expired verification link"
      });
    }
  };

  const handleResend = async () => {
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      toast({
        title: "Email sent",
        description: "Verification email has been resent"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to resend",
        description: "Please try again later"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Verify your email address to continue</h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            We sent an email to {email}. Click the link in that email to verify your account.
          </p>
          <button
            onClick={handleResend}
            className="mt-4 text-blue-600 hover:underline text-sm"
          >
            Resend email
          </button>
          <p className="mt-2 text-sm text-gray-500">
            Can't see an email? Check your spam or{' '}
            <button 
              onClick={() => navigate('/sign-up')}
              className="text-blue-600 hover:underline"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
