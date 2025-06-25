'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Power } from 'lucide-react'
import { TasmotaDevice } from '@/lib/api'

interface CriticalPowerConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  device?: TasmotaDevice
}

export function CriticalPowerConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  device
}: CriticalPowerConfirmDialogProps) {
  const [countdown, setCountdown] = useState(5)
  const [isConfirmEnabled, setIsConfirmEnabled] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Reset when dialog opens
      setCountdown(5)
      setIsConfirmEnabled(false)
      
      // Enable confirm after 5 seconds
      const confirmTimer = setTimeout(() => {
        setIsConfirmEnabled(true)
      }, 5000)
      
      // Update countdown display every second
      const countdownTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        clearTimeout(confirmTimer)
        clearInterval(countdownTimer)
      }
    }
  }, [isOpen])

  const handleConfirm = () => {
    if (isConfirmEnabled) {
      onConfirm()
      onClose()
    }
  }

  const handleClose = () => {
    setCountdown(5)
    setIsConfirmEnabled(false)
    onClose()
  }

  if (!device) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-2 border-amber-300 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700 text-lg font-bold">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Kritische Steckdose ausschalten?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl border-2 border-amber-300 shadow-md">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl shadow-lg">
              <Power className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-base">{device.device_name}</p>
              <p className="text-sm text-amber-700 font-medium">ID: {device.device_id}</p>
            </div>
          </div>

          <div className="space-y-4 p-4 bg-red-50 rounded-xl border-2 border-red-200">
            <p className="text-base text-gray-800 font-medium">
              <strong className="text-red-600 font-bold">⚠️ ACHTUNG:</strong> Sie sind dabei, eine als <strong className="text-amber-600">kritisch markierte</strong> Steckdose auszuschalten.
            </p>
            
            <p className="text-sm text-gray-700 font-medium bg-white p-3 rounded-lg border border-red-200">
              Dies könnte <strong className="text-red-600">wichtige Systeme oder Geräte beeinträchtigen</strong>.
            </p>
            
            <p className="text-sm text-gray-700 font-medium">
              Sind Sie sicher, dass Sie fortfahren möchten?
            </p>
          </div>

          <div className={`space-y-2 transition-all duration-500 ease-out ${!isConfirmEnabled ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'}`}>
            <span className="text-gray-600 font-medium text-sm">Sicherheits-Countdown</span>
            <div className="w-full bg-gray-200 rounded-full h-3 border border-gray-300 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                style={{
                  width: '100%',
                  animation: isOpen && !isConfirmEnabled ? 'countdown 5s linear forwards' : 'none'
                }}
              />
            </div>
          </div>
          
          <style jsx>{`
            @keyframes countdown {
              from {
                width: 100%;
              }
              to {
                width: 0%;
              }
            }
          `}</style>

          <div className="flex gap-4 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-2 border-gray-400 hover:bg-gray-100 font-medium text-base py-3"
            >
              Abbrechen
            </Button>
            
            <Button
              onClick={handleConfirm}
              disabled={!isConfirmEnabled}
              className={`flex-1 font-bold text-base py-3 transition-all duration-500 ease-out transform ${
                isConfirmEnabled 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg border-2 border-red-700 scale-100 opacity-100' 
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-300 opacity-60 scale-95'
              }`}
            >
              <span className={`flex items-center gap-2 transition-all duration-300 ${isConfirmEnabled ? 'opacity-100' : 'opacity-80'}`}>
                {isConfirmEnabled ? (
                  <>
                    <Power className={`h-4 w-4 transition-transform duration-300 ${isConfirmEnabled ? 'scale-100' : 'scale-90'}`} />
                    <span className="transition-all duration-300">Ausschalten bestätigen</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    <span>Bitte warten...</span>
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 