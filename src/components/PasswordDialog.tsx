'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react'
import { TasmotaDevice } from '@/lib/api'

interface PasswordDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  device?: TasmotaDevice
}

export function PasswordDialog({
  isOpen,
  onClose,
  onConfirm,
  device
}: PasswordDialogProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPassword('')
      setError('')
      setIsLoading(false)
    }
  }, [isOpen])

  const verifyPassword = async () => {
    if (!password.trim()) {
      setError('Bitte geben Sie ein Passwort ein')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Simulate password verification
      // In a real app, this would be an API call
      const response = await fetch('/api/security/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (response.ok) {
        onConfirm()
        onClose()
      } else {
        setError('Falsches Passwort')
      }
    } catch (err) {
      setError('Fehler bei der Passwort-Überprüfung')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      verifyPassword()
    }
  }

  const handleClose = () => {
    setPassword('')
    setError('')
    onClose()
  }

  if (!device) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-2 border-amber-300 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700 text-lg font-bold">
            <Lock className="h-6 w-6 text-amber-500" />
            Sicherheitspasswort erforderlich
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl border-2 border-amber-300 shadow-md">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl shadow-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-base">{device.device_name}</p>
              <p className="text-sm text-amber-700 font-medium">Kritische Steckdose</p>
            </div>
          </div>

          <div className="space-y-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <p className="text-base text-gray-800 font-medium">
              <strong className="text-blue-600 font-bold">🔒 Sicherheit:</strong> Geben Sie das Passwort ein, um diese kritische Steckdose auszuschalten.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Passwort
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Sicherheitspasswort eingeben"
                className={`pr-12 ${error ? 'border-red-500 focus:border-red-500' : ''}`}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}
          </div>

          <div className="flex gap-4 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-2 border-gray-400 hover:bg-gray-100 font-medium text-base py-3"
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            
            <Button
              onClick={verifyPassword}
              disabled={isLoading || !password.trim()}
              className={`flex-1 font-bold text-base py-3 transition-all duration-300 ${
                isLoading || !password.trim()
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-300'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg border-2 border-blue-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Überprüfen...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>Bestätigen</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 