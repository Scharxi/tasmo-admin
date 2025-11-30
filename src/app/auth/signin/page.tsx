"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { Eye, EyeOff, LogIn, Wifi, Shield, Zap, User, Server } from "lucide-react";

type AuthMode = 'admin' | 'ldap';

const SignInContent = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('admin');
  const [ldapEnabled, setLdapEnabled] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { toast } = useToast();

  // Check LDAP status on component mount
  useEffect(() => {
    const checkLdapStatus = async () => {
      try {
        const response = await fetch('/api/ldap/status');
        if (response.ok) {
          const data = await response.json();
          setLdapEnabled(data.enabled);
          
          // Set default auth mode based on LDAP availability
          if (data.enabled) {
            setAuthMode('ldap'); // Default to LDAP if available
          } else {
            setAuthMode('admin'); // Fall back to admin if LDAP is disabled
          }
        }
      } catch (error) {
        console.error('Error checking LDAP status:', error);
        setLdapEnabled(false);
        setAuthMode('admin'); // Default to admin on error
      } finally {
        setStatusLoading(false);
      }
    };

    checkLdapStatus();
  }, []); // Remove authMode dependency to avoid infinite loop

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie Benutzername und Passwort ein.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn(authMode, {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Anmeldung fehlgeschlagen",
          description: authMode === 'admin' 
            ? "Admin-Anmeldedaten sind falsch." 
            : "LDAP-Benutzername oder Passwort sind falsch.",
          variant: "destructive",
        });
      } else if (result?.ok) {
        const session = await getSession();
        if (session) {
          toast({
            title: "Erfolgreich angemeldet",
            description: `Willkommen ${session.user?.name || session.user?.username}!`,
          });
          router.push(callbackUrl);
        }
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchAuthMode = (mode: AuthMode) => {
    // Don't allow switching to LDAP if it's not enabled
    if (mode === 'ldap' && !ldapEnabled) {
      toast({
        title: "LDAP nicht verfügbar",
        description: "LDAP-Authentifizierung ist deaktiviert.",
        variant: "destructive",
      });
      return;
    }
    
    setAuthMode(mode);
    setUsername("");
    setPassword("");
  };

  // Show loading state while checking LDAP status
  if (statusLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <Card className="shadow-2xl border-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl backdrop-saturate-150">
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Lade Authentifizierungsoptionen...
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse opacity-70" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse opacity-70 animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse opacity-70 animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header section */}
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 p-4 shadow-xl shadow-blue-500/25 dark:shadow-blue-600/25 transform hover:scale-105 transition-transform duration-300">
                <Wifi className="h-full w-full text-white" />
              </div>
              {/* Floating icons */}
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Zap className="h-3 w-3 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg animate-bounce animation-delay-1000">
                <Shield className="h-3 w-3 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Tasmota Admin
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                Smart Home Management Portal
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Wählen Sie Ihre Authentifizierungsmethode
              </p>
            </div>
          </div>

          {/* Auth Mode Selection */}
          <div className="flex gap-2 p-1 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <Button
              type="button"
              variant={authMode === 'ldap' ? 'default' : 'ghost'}
              onClick={() => switchAuthMode('ldap')}
              disabled={!ldapEnabled}
              className={`flex-1 h-12 text-sm font-medium rounded-lg transition-all duration-300 ${
                authMode === 'ldap'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                  : ldapEnabled
                  ? 'text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-gray-700/70'
                  : 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              <Server className="h-4 w-4 mr-2" />
              LDAP Login
              {!ldapEnabled && (
                <span className="ml-1 text-xs">(deaktiviert)</span>
              )}
            </Button>
            <Button
              type="button"
              variant={authMode === 'admin' ? 'default' : 'ghost'}
              onClick={() => switchAuthMode('admin')}
              className={`flex-1 h-12 text-sm font-medium rounded-lg transition-all duration-300 ${
                authMode === 'admin'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-gray-700/70'
              }`}
            >
              <User className="h-4 w-4 mr-2" />
              Admin Login
            </Button>
          </div>



          {/* Login card */}
          <Card className="shadow-2xl border-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 hover:shadow-3xl hover:bg-white/80 dark:hover:bg-gray-900/80">
            <CardHeader className="space-y-4 pb-8">
              <div className="flex items-center justify-center gap-3">
                <div className={`p-2 rounded-lg shadow-md ${
                  authMode === 'admin' 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                    : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                }`}>
                  {authMode === 'admin' ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Server className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="text-center">
                  <CardTitle className={`text-xl font-bold bg-gradient-to-r ${
                    authMode === 'admin' 
                      ? 'from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400' 
                      : 'from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400'
                  } bg-clip-text text-transparent`}>
                    {authMode === 'admin' ? 'Administrator' : 'LDAP Benutzer'}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {authMode === 'admin' ? 'Vollzugriff' : 'Standard Zugriff'}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-center text-gray-600 dark:text-gray-400">
                {authMode === 'admin' 
                  ? 'Melden Sie sich mit Administrator-Anmeldedaten an' 
                  : 'Melden Sie sich mit Ihren LDAP-Anmeldedaten an'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Benutzername
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder={authMode === 'admin' ? 'Admin-Benutzername' : 'LDAP-Benutzername'}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      className={`h-12 pl-4 pr-4 text-base border-2 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all duration-300 focus:shadow-lg focus:ring-0 focus:outline-none focus:bg-white/80 dark:focus:bg-gray-800/80 ${
                        authMode === 'admin'
                          ? 'border-purple-200 dark:border-purple-700 focus:border-purple-400/60 dark:focus:border-purple-400/60 focus:shadow-purple-500/10'
                          : 'border-blue-200 dark:border-blue-700 focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:shadow-blue-500/10'
                      }`}
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                </div>
                
                {/* Password field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Passwort
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ihr Passwort"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className={`h-12 pl-4 pr-12 text-base border-2 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all duration-300 focus:shadow-lg focus:ring-0 focus:outline-none focus:bg-white/80 dark:focus:bg-gray-800/80 ${
                        authMode === 'admin'
                          ? 'border-purple-200 dark:border-purple-700 focus:border-purple-400/60 dark:focus:border-purple-400/60 focus:shadow-purple-500/10'
                          : 'border-blue-200 dark:border-blue-700 focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:shadow-blue-500/10'
                      }`}
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  className={`w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl transform hover:scale-[1.02] active:scale-[0.98] ${
                    authMode === 'admin'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600'
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Anmelden...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-3">
                      <LogIn className="h-5 w-5" />
                      <span>
                        {authMode === 'admin' ? 'Als Administrator anmelden' : 'Als Benutzer anmelden'}
                      </span>
                    </div>
                  )}
                </Button>
              </form>

              {/* Information section */}
              <div className={`p-4 rounded-xl border ${
                authMode === 'admin'
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}>
                <div className="flex items-start gap-3">
                  <Shield className={`h-5 w-5 mt-0.5 ${
                    authMode === 'admin' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'
                  }`} />
                  <div>
                    <h4 className={`font-semibold ${
                      authMode === 'admin' ? 'text-purple-800 dark:text-purple-300' : 'text-blue-800 dark:text-blue-300'
                    } mb-2`}>
                      {authMode === 'admin' ? 'Administrator-Zugang' : 'LDAP-Authentifizierung'}
                    </h4>
                    <ul className={`text-sm space-y-1 ${
                      authMode === 'admin' ? 'text-purple-700 dark:text-purple-300' : 'text-blue-700 dark:text-blue-300'
                    }`}>
                      {authMode === 'admin' ? (
                        <>
                          <li>• Vollzugriff auf alle Systemeinstellungen</li>
                          <li>• LDAP-Konfiguration und Benutzerverwaltung</li>
                          <li>• Erweiterte Sicherheitsoptionen</li>
                        </>
                      ) : (
                        <>
                          <li>• Authentifizierung über LDAP-Server</li>
                          <li>• Standard-Benutzerzugriff auf Geräte</li>
                          <li>• Eingeschränkte Systemkonfiguration</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Brauchen Sie Hilfe?
              </p>
              <div className="w-8 h-px bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600" />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Kontaktieren Sie Ihren Administrator für Unterstützung
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-grid-pattern {
          background-image: radial-gradient(circle, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
};

const SignInFallback = () => (
  <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950">
    <div className="absolute inset-0 bg-grid-pattern opacity-5" />
    <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <Card className="shadow-2xl border-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl backdrop-saturate-150">
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Laden...
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
    <style jsx>{`
      .bg-grid-pattern {
        background-image: radial-gradient(circle, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
        background-size: 20px 20px;
      }
    `}</style>
  </div>
);

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent />
    </Suspense>
  );
}
