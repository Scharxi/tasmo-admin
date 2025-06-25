'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Lock, Shield, Eye, EyeOff, Save, CheckCircle } from 'lucide-react'

interface SecurityConfig {
  isEnabled: boolean
  hasPassword: boolean
}

export function SecuritySettings() {
  const [config, setConfig] = useState<SecurityConfig>({
    isEnabled: false,
    hasPassword: false
  })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadSecurityConfig()
  }, [])

  const loadSecurityConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/security/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (err) {
      console.error('Failed to load security config:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveSecurityConfig = async () => {
    if (config.isEnabled && !config.hasPassword && password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    if (config.isEnabled && !config.hasPassword && password.length < 4) {
      setError('Passwort muss mindestens 4 Zeichen lang sein')
      return
    }

    setSaving(true)
    setError('')

    try {
      const requestBody: any = {
        isEnabled: config.isEnabled
      }

      // Only include password if enabling security and no password is set yet
      if (config.isEnabled && !config.hasPassword && password) {
        requestBody.password = password
      }

      const response = await fetch('/api/security/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const updatedConfig = await response.json()
        setConfig(updatedConfig)
        setPassword('')
        setConfirmPassword('')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fehler beim Speichern der Einstellungen')
      }
    } catch (err) {
      console.error('Security config save error:', err)
      setError('Verbindungsfehler')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleEnabled = (enabled: boolean) => {
    setConfig(prev => ({ ...prev, isEnabled: enabled }))
    setError('')
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <span>Sicherheit</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={config.isEnabled ? "default" : "secondary"}
                className={`text-xs font-medium ${
                  config.isEnabled 
                    ? 'bg-green-100 text-green-800 border-green-300' 
                    : 'bg-gray-100 text-gray-600 border-gray-300'
                }`}
              >
                {config.isEnabled ? 'Aktiviert' : 'Deaktiviert'}
              </Badge>
              {config.hasPassword && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                  <Lock className="h-3 w-3 mr-1" />
                  Passwort gesetzt
                </Badge>
              )}
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="space-y-1">
            <Label className="text-base font-semibold text-gray-800">
              Passwort-Schutz für kritische Steckdosen
            </Label>
            <p className="text-sm text-gray-600">
              Zusätzliche Sicherheit beim Ausschalten kritischer Geräte
            </p>
          </div>
          <Switch
            checked={config.isEnabled}
            onCheckedChange={handleToggleEnabled}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>

        {config.isEnabled && !config.hasPassword && (
          <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center gap-2 text-amber-700 font-medium">
              <Lock className="h-4 w-4" />
              <span>Passwort festlegen</span>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                  Neues Passwort
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mindestens 4 Zeichen"
                    className="pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                  Passwort bestätigen
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Passwort wiederholen"
                    className="pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {config.isEnabled && config.hasPassword && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
              <CheckCircle className="h-4 w-4" />
              <span>Passwort-Schutz aktiv</span>
            </div>
            <p className="text-sm text-green-600">
              Beim Ausschalten kritischer Steckdosen wird eine Passwort-Eingabe erforderlich.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-green-300 text-green-700 hover:bg-green-100"
              onClick={() => setConfig(prev => ({ ...prev, hasPassword: false }))}
            >
              Passwort ändern
            </Button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600 font-medium">
              Sicherheitseinstellungen erfolgreich gespeichert
            </p>
          </div>
        )}

        <Button
          onClick={saveSecurityConfig}
          disabled={saving || (config.isEnabled && !config.hasPassword && (!password || password !== confirmPassword))}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-xl shadow-lg border border-blue-700 transition-all duration-300"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Speichern...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              <span>Einstellungen speichern</span>
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  )
} 