import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EmailSetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function EmailSetupWizard({ onComplete, onSkip }: EmailSetupWizardProps) {
  const [step, setStep] = useState<'detect' | 'setup' | 'manual'>('detect');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [autoConfig, setAutoConfig] = useState<any>(null);
  const [setupResult, setSetupResult] = useState<any>(null);
  const { toast } = useToast();

  const detectEmailProvider = async () => {
    setLoading(true);
    try {
      const config = await apiRequest('/api/email/auto-config');
      setAutoConfig(config);
      
      if (config.canAutoSetup) {
        setStep('setup');
      } else {
        setStep('manual');
      }
    } catch (error) {
      toast({
        title: "Detection Failed",
        description: "Could not detect email provider",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const attemptAutoSetup = async () => {
    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter your email password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest('/api/email/auto-setup', {
        method: 'POST',
        body: JSON.stringify({ password }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      setSetupResult(result);
      
      if (result.success) {
        toast({
          title: "Email Configured",
          description: "Email notifications are now active",
        });
        setTimeout(() => onComplete(), 2000);
      } else {
        toast({
          title: "Setup Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Setup Error",
        description: "Failed to configure email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'detect') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Setup Email Notifications</CardTitle>
          <CardDescription>
            Get notified when new letters are processed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            We'll automatically detect your email provider and configure notifications for you.
          </p>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={detectEmailProvider} 
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Auto-Configure Email
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onSkip}
              className="w-full"
            >
              Skip for Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'setup') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle>Provider Detected: {autoConfig?.provider}</CardTitle>
          <CardDescription>
            {autoConfig?.instructions}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupResult && (
            <Alert variant={setupResult.success ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{setupResult.message}</AlertDescription>
            </Alert>
          )}
          
          {!setupResult?.success && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Email Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your email password"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={attemptAutoSetup} 
                  disabled={loading || !password}
                  className="w-full"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Configure Email
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setStep('manual')}
                  className="w-full"
                >
                  Manual Setup
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === 'manual') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          </div>
          <CardTitle>Manual Setup Required</CardTitle>
          <CardDescription>
            {autoConfig?.instructions || "Your email provider requires manual configuration"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              Please contact support or check the documentation for manual email setup instructions.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              onClick={onComplete}
              className="w-full"
            >
              Continue Without Email
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setStep('detect')}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}