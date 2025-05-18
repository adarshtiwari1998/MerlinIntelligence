
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function Verify() {
  const [email, setEmail] = useState('');
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('oobCode');
    const mode = params.get('mode');
    const goto = params.get('goto');

    // Get email from localStorage
    const storedEmail = localStorage.getItem('verificationEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }

    // If we have a token and mode is verifyEmail, verify it
    if (token && mode === 'verifyEmail') {
      verifyEmail(token);
    }

    // Handle redirect after verification
    if (goto) {
      const redirectPath = decodeURIComponent(goto);
      if (redirectPath === '/~' && verificationStatus === 'success') {
        navigate('/chat');
      }
    }
  }, [location.search, verificationStatus]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        setVerificationStatus('success');
        toast({
          title: "Email verified",
          description: "Verification successful! Redirecting to chat..."
        });
        localStorage.removeItem('verificationEmail');
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

  const handleResend = async () => {
    try {
      const emailToVerify = email || localStorage.getItem('verificationEmail');
      if (!emailToVerify) {
        throw new Error('No email found for verification');
      }

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emailToVerify,
          goto: '/~'
        })
      });

      if (response.ok) {
        toast({
          title: "Email sent",
          description: "New verification email has been sent"
        });
      } else {
        throw new Error('Failed to resend verification email');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to resend",
        description: "Please try again later"
      });
    }
  };

  // Different layout for action-code verification
  if (location.pathname === '/action-code') {
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

  // Original verify page layout
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Verify your email address to continue</h2>
          {email && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              We sent an email to {email}. Click the link in that email to verify your account.
            </p>
          )}
          <Button
            onClick={handleResend}
            className="mt-4"
            variant="outline"
          >
            Resend verification email
          </Button>
        </div>
      </div>
    </div>
  );
}
