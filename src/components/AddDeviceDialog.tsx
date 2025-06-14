'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Search } from 'lucide-react'
import { tasmotaAPI, CreateDeviceRequest, TasmotaDevice } from '@/lib/api'

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)

const DeviceIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-10.5 3.75H7.5m9-6.75h1.5m-9 6.75v1.5m-1.5-3h1.5m9-6.75V3m-3.75 3.75h3.75m0 0V3m0 3.75L18 7.5M3.75 9.75L7.5 6m0 0L3.75 9.75M7.5 6h.75m9.75 3L13.5 12m0 0 3.75 3.75M13.5 12H7.5m0 0L3.75 9.75" />
  </svg>
)

interface AddDeviceDialogProps {
  isOpen: boolean
  onClose: () => void
  onDeviceAdded: () => void
}

export function AddDeviceDialog({ isOpen, onClose, onDeviceAdded }: AddDeviceDialogProps) {
  const router = useRouter()
  const [ipAddress, setIpAddress] = useState('')
  const [deviceInfo, setDeviceInfo] = useState<TasmotaDevice | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([])

  const handleFetchDeviceInfo = async () => {
    if (!ipAddress.trim()) {
      setError('Please enter an IP address')
      return
    }

    setIsFetching(true)
    setError(null)
    setSuccess(null)
    setDeviceInfo(null)

    try {
      const info = await tasmotaAPI.fetchDeviceInfo(ipAddress.trim())
      setDeviceInfo(info)
      setSuccess('Device information fetched successfully!')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch device information')
    } finally {
      setIsFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!deviceInfo) {
      setError('Please fetch device information first')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await tasmotaAPI.createDevice({ ipAddress: deviceInfo.ip_address })
      setSuccess('Device added successfully! Redirecting to dashboard...')
      
      // Navigate to dashboard after success
      setTimeout(() => {
        onDeviceAdded()
        onClose()
        router.push('/')
      }, 2000)
      
      // Reset form
      setIpAddress('')
      setDeviceInfo(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add device')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDiscover = async () => {
    setIsDiscovering(true)
    setError(null)
    setSuccess(null)

    try {
      const devices = await tasmotaAPI.discoverDevices()
      setDiscoveredDevices(devices)
      if (devices.length > 0) {
        setSuccess(`Found ${devices.length} device(s)!`)
      } else {
        setError('No devices found. Make sure devices are on the same network.')
      }
    } catch (error) {
      setError('Failed to discover devices. Make sure devices are on the same network.')
    } finally {
      setIsDiscovering(false)
    }
  }

  const handleSelectDiscovered = (device: any) => {
    setIpAddress(device.ip_address)
    setDeviceInfo(device)
    setDiscoveredDevices([])
    setSuccess('Device selected from discovery!')
  }

  const resetForm = () => {
    setIpAddress('')
    setDeviceInfo(null)
    setError(null)
    setSuccess(null)
    setDiscoveredDevices([])
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <DeviceIcon />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">
                  Add Tasmota Device
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Enter IP address to automatically detect device information
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Device Discovery Section */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-blue-900">Auto-Discovery</h3>
                <p className="text-sm text-blue-700">Scan network for Tasmota devices</p>
              </div>
              <Button
                onClick={handleDiscover}
                disabled={isDiscovering}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isDiscovering ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                {isDiscovering ? 'Scanning...' : 'Discover'}
              </Button>
            </div>

            {discoveredDevices.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900">Found devices:</p>
                {discoveredDevices.map((device, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{device.device_name}</p>
                      <p className="text-sm text-gray-600">{device.ip_address}</p>
                    </div>
                    <Button
                      onClick={() => handleSelectDiscovered(device)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual IP Entry */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Manual Entry</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IP Address *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => {
                      setIpAddress(e.target.value)
                      setError(null)
                      setSuccess(null)
                      setDeviceInfo(null)
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 192.168.1.100"
                    required
                  />
                  <Button
                    type="button"
                    onClick={handleFetchDeviceInfo}
                    disabled={isFetching || !ipAddress.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white px-4"
                  >
                    {isFetching ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Fetch Info'
                    )}
                  </Button>
                </div>
              </div>

              {/* Device Information Preview */}
              {deviceInfo && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-3">Device Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-green-800">Device Name:</span>
                      <p className="text-green-700">{deviceInfo.device_name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Device ID:</span>
                      <p className="text-green-700">{deviceInfo.device_id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">MAC Address:</span>
                      <p className="text-green-700">{deviceInfo.mac_address || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Firmware:</span>
                      <p className="text-green-700">{deviceInfo.firmware_version}</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Status:</span>
                      <Badge className={deviceInfo.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {deviceInfo.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Power:</span>
                      <Badge className={deviceInfo.power_state ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                        {deviceInfo.power_state ? 'ON' : 'OFF'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="outline"
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !deviceInfo}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <PlusIcon />
                      Add Device
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 