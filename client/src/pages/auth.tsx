import { useState, useEffect } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { useToast } from "@/hooks/use-toast";

interface AuthPageProps {
  onAuthSuccess: (user: any) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();

  // Handle OAuth callbacks and URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const auth = urlParams.get('auth');
    const provider = urlParams.get('provider');
    const error = urlParams.get('error');

    if (error) {
      if (error === 'oauth_failed') {
        toast({
          title: "Authentication failed",
          description: "There was an issue with the authentication process. Please try again.",
          variant: "destructive",
        });
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (auth === 'success' && provider) {
      // Fetch user data (cookie is already set by server)
      fetch('/api/auth/user', {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(user => {
          toast({
            title: "Welcome!",
            description: `Successfully signed in with ${provider}.`,
          });
          onAuthSuccess(user);
        })
        .catch(() => {
          toast({
            title: "Authentication error",
            description: "Failed to fetch user information. Please try again.",
            variant: "destructive",
          });
        });

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [onAuthSuccess, toast]);

  const handleAuthSuccess = (user: any) => {
    onAuthSuccess(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setIsLogin(false)}
          />
        ) : (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  );
}