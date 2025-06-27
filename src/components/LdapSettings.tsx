'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Settings2, Server, Shield, CheckCircle, XCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface LdapConfig {
  ldapUrl: string
  baseDn: string
  enabled: boolean
}

export function LdapSettings() {
  const { data: session } = useSession()
  const [config, setConfig] = useState<LdapConfig>({
    ldapUrl: '',
    baseDn: '',
    enabled: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check if user is admin
  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      loadConfig()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  const loadConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/ldap/config')
      if (!response.ok) {
        throw new Error('Failed to load LDAP configuration')
      }
      
      const data = await response.json()
      setConfig(data.config)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load LDAP configuration')
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      const response = await fetch('/api/ldap/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save LDAP configuration')
      }
      
      const data = await response.json()
      setSuccess(data.message || 'LDAP configuration saved successfully')
      
      // If changes require reload, show additional info
      if (data.requiresReload) {
        setTimeout(() => {
          setSuccess(data.message + ' Melden Sie sich ab und wieder an, um die Änderungen zu sehen.')
        }, 1000)
      }
      
      setTimeout(() => setSuccess(null), 8000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save LDAP configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleConfigChange = (field: keyof LdapConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  if (!isAdmin) {
    return (
      <Card className="border-2 border-red-100 dark:border-red-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <Shield className="h-5 w-5" />
            <span className="font-medium">Zugriff verweigert</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            Diese Einstellungen sind nur für Administratoren verfügbar.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="border-2 border-blue-100 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Lade LDAP-Konfiguration...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-purple-100 dark:border-purple-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-200">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-md">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <span>LDAP-Konfiguration</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={config.enabled ? "default" : "secondary"}
                className={`text-xs font-medium flex items-center gap-1 ${
                  config.enabled 
                    ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-600 dark:text-white dark:border-green-600' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                }`}
              >
                {config.enabled ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {config.enabled ? 'Aktiviert' : 'Deaktiviert'}
              </Badge>
            </div>
          </div>
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Konfigurieren Sie die LDAP-Authentifizierung für Benutzeranmeldungen
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Enable LDAP Toggle */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="space-y-1">
            <Label className="text-base font-semibold text-gray-800 dark:text-gray-200">
              LDAP-Authentifizierung aktivieren
            </Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ermöglicht Benutzern die Anmeldung über LDAP-Server
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
            className="data-[state=checked]:bg-purple-600"
          />
        </div>

        {/* LDAP Configuration Fields */}
        {config.enabled && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-1">
              {/* LDAP URL */}
              <div className="space-y-2">
                <Label htmlFor="ldapUrl" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  LDAP Server URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ldapUrl"
                  type="text"
                  placeholder="ldap://localhost:389"
                  value={config.ldapUrl}
                  onChange={(e) => handleConfigChange('ldapUrl', e.target.value)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Format: ldap://hostname:port oder ldaps://hostname:port für SSL
                </p>
              </div>

              {/* Base DN */}
              <div className="space-y-2">
                <Label htmlFor="baseDn" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Base Distinguished Name (DN) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="baseDn"
                  type="text"
                  placeholder="dc=example,dc=com"
                  value={config.baseDn}
                  onChange={(e) => handleConfigChange('baseDn', e.target.value)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Der Basis-DN für LDAP-Suchvorgänge (z.B. dc=tasmota,dc=local)
                </p>
              </div>
            </div>

            {/* Configuration Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-start gap-3">
                <Settings2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    Authentifizierung-Hinweise
                  </h4>
                                     <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                     <li>• Benutzer werden als uid=username,ou=users,{config.baseDn} gesucht</li>
                     <li>• Sowohl Admin- als auch LDAP-Authentifizierung sind gleichzeitig aktiv</li>
                     <li>• Admin-Zugang bleibt auch bei LDAP-Fehlern verfügbar</li>
                     <li>• Nach Änderungen ist ein Neustart der Anwendung erforderlich</li>
                   </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={saveConfig}
          disabled={saving || (!config.enabled && !config.ldapUrl && !config.baseDn)}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-3 rounded-xl shadow-lg border border-purple-700 transition-all duration-300"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Speichere...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              <span>Konfiguration speichern</span>
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  )
} 