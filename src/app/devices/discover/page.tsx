'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DeviceDiscovery } from '@/components/device-discovery'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

interface DiscoveredDevice {
  device_id: string
  device_name: string
  ip_address: string
  mac_address?: string
  firmware_version: string
  status: string
  power_state: boolean
  energy_consumption: number
  wifi_signal: number
  voltage: number
  current: number
}

export default function DeviceDiscoveryPage() {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleDevicesSelected = async (devices: DiscoveredDevice[]) => {
    if (devices.length === 0) return

    setIsAdding(true)
    setNotification(null)
    let addedCount = 0
    let failedCount = 0

    try {
      // Add devices one by one to handle individual failures
      for (const device of devices) {
        try {
          const response = await fetch('/api/devices', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deviceId: device.device_id,
              deviceName: device.device_name,
              ipAddress: device.ip_address,
              macAddress: device.mac_address,
              firmwareVersion: device.firmware_version,
            }),
          })

          if (response.ok) {
            addedCount++
          } else {
            const errorData = await response.json()
            console.error(`Failed to add device ${device.device_name}:`, errorData.error)
            failedCount++
          }
        } catch (error) {
          console.error(`Error adding device ${device.device_name}:`, error)
          failedCount++
        }
      }

      // Show success/failure notification
      if (addedCount > 0) {
        setNotification({
          type: 'success',
          message: `${addedCount} Gerät(e) erfolgreich hinzugefügt! Weiterleitung zum Dashboard...`
        })
        
        // Navigate to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
      
      if (failedCount > 0) {
        setNotification({
          type: 'error',
          message: `${failedCount} Gerät(e) konnten nicht hinzugefügt werden.`
        })
      }

    } catch (error) {
      console.error('Error during device addition:', error)
      setNotification({
        type: 'error',
        message: 'Fehler beim Hinzufügen der Geräte'
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Background Elements - Same as Dashboard */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-blue-100/60 to-transparent rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-purple-100/40 to-transparent rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/90 rounded-2xl p-6 border border-gray-200 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/')}
                  className="rounded-xl bg-gray-100 hover:bg-gray-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl p-2.5 text-white shadow-lg">
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Geräte Discovery
                  </h1>
                  <p className="text-gray-600 font-medium">
                    Scanne dein Netzwerk nach verfügbaren Tasmota-Geräten
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Alert */}
      {notification && (
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-4">
          <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {notification.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-8">
        <DeviceDiscovery 
          onDevicesSelected={handleDevicesSelected}
        />
      </main>

      {/* Loading overlay for adding devices */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/90 p-8 rounded-2xl shadow-2xl border border-gray-200 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <div>
                <p className="font-semibold text-gray-800">Geräte werden hinzugefügt...</p>
                <p className="text-sm text-gray-600">Bitte warten Sie einen Moment</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 