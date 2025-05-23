import { Route, Switch } from 'wouter';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import Home from '@/pages/home';
import Login from '@/pages/login';
import Register from '@/pages/register';
import ForgotPassword from '@/pages/forgot-password';
import NotFound from '@/pages/not-found';
import ResetPassword from '@/pages/reset-password';
import Verify from '@/pages/verify';
import ActionCode from '@/pages/action-code';

export default function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/sign-up" component={Register} />
        <Route path="/action-code" component={ActionCode} />
        <Route path="/verify" component={Verify} />
        <Route path="/forget" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/chat">
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        </Route>
        <Route path="/">
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </AuthProvider>
  );
}