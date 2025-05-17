
import { Route, Switch } from 'wouter';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import Home from '@/pages/home';
import Login from '@/pages/login';
import NotFound from '@/pages/not-found';

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/chat">
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          </Route>
          <Route path="/" component={Login} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
