
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function Verify() {
  const [email, setEmail] = useState('');
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    // Check if user is already verified
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        if (response.ok && data.user?.verified) {
          navigate('/chat');
          return;
        }

        // If not on verify page and not verified, redirect to verify
        if (!location.pathname.startsWith('/verify') && !data.user?.verified) {
          navigate('/verify?goto=%2F~');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAuth();

    const params = new URLSearchParams(location.search);
    const token = params.get('code') || params.get('oobCode');
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
      if (redirectPath === '/~') {
        navigate('/chat');
      }
    }
  }, [location.search]);

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
      // Get email from localStorage if not in state
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

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Email Verified Successfully!</h1>
          <p>Redirecting to chat...</p>
        </div>
      </div>
    );
  }

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
