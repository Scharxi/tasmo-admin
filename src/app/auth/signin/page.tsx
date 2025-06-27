"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { Eye, EyeOff, LogIn, Wifi, Shield, Zap } from "lucide-react";

export default function SignInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { toast } = useToast();

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
      const result = await signIn("ldap", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Anmeldung fehlgeschlagen",
          description: "Benutzername oder Passwort sind falsch.",
          variant: "destructive",
        });
      } else if (result?.ok) {
        toast({
          title: "Erfolgreich angemeldet",
          description: "Sie werden weitergeleitet...",
        });
        
        // Verify session was created
        const session = await getSession();
        if (session) {
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
          {/* Header section with enhanced styling */}
          <div className="text-center space-y-6">
            {/* Logo container with glassmorphism effect */}
            <div className="relative">
              <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 p-4 shadow-xl shadow-blue-500/25 dark:shadow-blue-600/25 transform hover:scale-105 transition-transform duration-300">
                <Wifi className="h-full w-full text-white" />
              </div>
              {/* Floating icons around logo */}
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Zap className="h-3 w-3 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg animate-bounce animation-delay-1000">
                <Shield className="h-3 w-3 text-white" />
              </div>
            </div>

            {/* Title with enhanced typography */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Tasmota Admin
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                Smart Home Management Portal
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Melden Sie sich mit Ihren LDAP-Anmeldedaten an
              </p>
            </div>
          </div>

          {/* Login card with enhanced glassmorphism */}
          <Card className="shadow-2xl border-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 hover:shadow-3xl hover:bg-white/80 dark:hover:bg-gray-900/80">
            <CardHeader className="space-y-2 pb-8">
              <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Anmelden
              </CardTitle>
              <CardDescription className="text-center text-gray-600 dark:text-gray-400">
                Geben Sie Ihre Anmeldedaten ein, um fortzufahren
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username field with enhanced styling */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Benutzername
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder="Ihr LDAP-Benutzername"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      className="h-12 pl-4 pr-4 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-400/60 dark:focus:border-blue-400/60 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all duration-300 focus:shadow-lg focus:shadow-blue-500/10 focus:ring-0 focus:outline-none focus:bg-white/80 dark:focus:bg-gray-800/80"
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                </div>
                
                {/* Password field with enhanced styling */}
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
                      className="h-12 pl-4 pr-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-400/60 dark:focus:border-blue-400/60 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all duration-300 focus:shadow-lg focus:shadow-blue-500/10 focus:ring-0 focus:outline-none focus:bg-white/80 dark:focus:bg-gray-800/80"
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

                {/* Enhanced submit button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl transform hover:scale-[1.02] active:scale-[0.98]"
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
                      <span>Anmelden</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Enhanced footer */}
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
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
} 