import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function Verify() {
  const [email, setEmail] = useState('');
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (!token) {
      toast({
        variant: "destructive",
        title: "Missing verification token",
        description: "Please use the link from your email"
      });
      navigate('/sign-up');
      return;
    }

    // First verify the token is valid
    fetch(`/api/auth/verify/check?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        setEmail(data.email);
        return fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          toast({
            title: "Email verified",
            description: "Redirecting to chat..."
          });
          setTimeout(() => navigate('/chat'), 1500);
        }
      })
      .catch(error => {
        toast({
          variant: "destructive", 
          title: "Verification failed",
          description: error.message || "Please try signing up again"
        });
        navigate('/sign-up');
      });
      toast({
        variant: "destructive", 
        title: "Invalid verification link",
        description: "Please try signing up again"
      });
      navigate('/sign-up');
      return;
    }

    // Get email and trigger verification email
    fetch(`/api/auth/verify/check?token=${token}&sendEmail=true`)
      .then(res => res.json())
      .then(data => {
        if (data.email) {
          setEmail(data.email);
          verifyEmail(token);
        }
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Invalid verification link",
          description: "Please try signing up again"
        });
        navigate('/sign-up');
      });

    // Get email from storage
    const storedEmail = localStorage.getItem('verificationEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }

    // Get verification params from URL
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