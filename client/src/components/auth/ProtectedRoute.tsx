
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './AuthProvider';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Check if user needs verification
    if (!user?.verified) {
      navigate('/verify?goto=%2F~');
    }
  }, [isAuthenticated, user]);

  return isAuthenticated && user?.verified ? <>{children}</> : null;
}
