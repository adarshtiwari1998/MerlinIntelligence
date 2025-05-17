
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';

export default function Verify() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const storedEmail = localStorage.getItem('verificationEmail');
    if (!storedEmail) {
      navigate('/register');
      return;
    }
    setEmail(storedEmail);
  }, [navigate]);

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
        localStorage.removeItem('verificationEmail');
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
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold">Verify your email address to continue</h3>
          <p className="text-gray-600 dark:text-gray-400">
            We sent an email to {email}. Click the link in that email to verify your account.
          </p>
          <p className="text-sm text-gray-500">
            Don't see an email? Check your spam or
            <button 
              onClick={() => navigate('/register')}
              className="ml-1 text-blue-600 hover:underline"
            >
              try again
            </button>
          </p>
        </div>
        {/* We'll keep OTP input for manual verification as fallback */}
        <div className="mt-8">
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
            className="w-full mt-4"
          >
            Verify Email
          </Button>
        </div>
      </div>
    </div>
  );
}
