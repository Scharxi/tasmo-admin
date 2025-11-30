"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Wifi } from "lucide-react";
import Link from "next/link";

const errorMessages: Record<string, string> = {
  Configuration: "Es gibt ein Problem mit der Server-Konfiguration.",
  AccessDenied: "Sie haben keine Berechtigung, auf diese Anwendung zuzugreifen.",
  Verification: "Das Verifizierungstoken ist ungültig oder abgelaufen.",
  Default: "Ein unerwarteter Fehler ist aufgetreten.",
  CredentialsSignin: "Anmeldedaten sind falsch. Bitte überprüfen Sie Ihren Benutzernamen und Ihr Passwort.",
  SessionRequired: "Sie müssen sich anmelden, um auf diese Seite zuzugreifen.",
};

const AuthErrorContent = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";
  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Anmeldung fehlgeschlagen
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Ein Fehler ist bei der Anmeldung aufgetreten
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold text-center text-red-600 dark:text-red-400">
              Fehler: {error}
            </CardTitle>
            <CardDescription className="text-center">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">
                {error === "CredentialsSignin" && (
                  <>
                    <strong>Anmeldetipps:</strong>
                    <br />• Überprüfen Sie Ihren Benutzernamen
                    <br />• Überprüfen Sie Ihr Passwort
                    <br />• Stellen Sie sicher, dass Ihr LDAP-Konto aktiv ist
                  </>
                )}
                {error === "AccessDenied" && (
                  <>
                    <strong>Zugriff verweigert:</strong>
                    <br />• Ihr Konto hat möglicherweise nicht die erforderlichen Berechtigungen
                    <br />• Kontaktieren Sie Ihren Administrator
                  </>
                )}
                {error === "Configuration" && (
                  <>
                    <strong>Server-Problem:</strong>
                    <br />• Dies ist ein temporäres Problem
                    <br />• Versuchen Sie es später erneut
                    <br />• Kontaktieren Sie den Support, falls das Problem weiterhin besteht
                  </>
                )}
                {!["CredentialsSignin", "AccessDenied", "Configuration"].includes(error) && (
                  <>
                    <strong>Allgemeiner Fehler:</strong>
                    <br />• Versuchen Sie es erneut
                    <br />• Überprüfen Sie Ihre Internetverbindung
                    <br />• Kontaktieren Sie den Administrator bei anhaltenden Problemen
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col space-y-2">
              <Link href="/auth/signin">
                <Button className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück zur Anmeldung
                </Button>
              </Link>
              
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <Wifi className="mr-2 h-4 w-4" />
                  Zur Startseite
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Probleme mit der Anmeldung?</p>
          <p>Kontaktieren Sie Ihren Administrator für Hilfe</p>
          {error && (
            <p className="mt-2 font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
              Fehler-Code: {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const AuthErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div className="w-full max-w-md space-y-8 px-4 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4 animate-pulse">
        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <p className="text-gray-600 dark:text-gray-400">Laden...</p>
    </div>
  </div>
);

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<AuthErrorFallback />}>
      <AuthErrorContent />
    </Suspense>
  );
}
