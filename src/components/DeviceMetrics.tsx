'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDeviceMetrics } from '@/hooks/useDevices'
import { Skeleton } from './ui/skeleton'
import { useState, useCallback } from 'react'

// Icons für Messwerte
const VoltageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
)

const CurrentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
  </svg>
)

const PowerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
)

const EnergyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.012-.529 1.348A109.58 109.58 0 0112 18.75c-2.305 0-4.584-.124-6.826-.364-.423-.336-.651-.849-.529-1.348L7.25 4.97" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const WarningIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
)

interface DeviceMetricsProps {
  deviceId: string
  className?: string
}

interface MetricsData {
  power: number
  apparent_power: number
  reactive_power: number
  factor: number
  voltage: number
  current: number
  total: number
  today: number
  yesterday: number
  has_energy_monitoring?: boolean
  device_online?: boolean
  last_update: string
  message?: string
}

export function DeviceMetrics({ deviceId, className = '' }: DeviceMetricsProps) {
  const { data: metrics, isLoading, error, isRefetching, refetch } = useDeviceMetrics(deviceId)
  const [isManualRefresh, setIsManualRefresh] = useState(false)

  const handleManualRefresh = useCallback(async () => {
    setIsManualRefresh(true)
    try {
      // Force refresh via POST to metrics endpoint
      await fetch(`/api/devices/${deviceId}/metrics`, { method: 'POST' })
      await refetch()
    } catch (error) {
      console.error('Failed to refresh metrics:', error)
    } finally {
      setIsManualRefresh(false)
    }
  }, [deviceId, refetch])

  if (isLoading) {
    return (
      <Card className={`bg-white/90 border-gray-200 shadow-sm ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <EnergyIcon />
            Messwerte
            <div className="ml-auto">
              <Skeleton className="w-16 h-4" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="w-16 h-4" />
              </div>
              <div className="text-right">
                <Skeleton className="w-12 h-5 mb-1" />
                <Skeleton className="w-8 h-3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`bg-white/90 border-red-200 shadow-sm ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
            <WarningIcon />
            Messwerte
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isManualRefresh}
                className="h-6 px-2 text-xs"
              >
                {isManualRefresh ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshIcon />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-sm mb-2">
            Fehler beim Laden der Messwerte
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs"
          >
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card className={`bg-white/90 border-gray-200 shadow-sm ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <EnergyIcon />
            Messwerte
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isManualRefresh}
                className="h-6 px-2 text-xs"
              >
                {isManualRefresh ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshIcon />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Keine Messwerte verfügbar</p>
        </CardContent>
      </Card>
    )
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Determine card styling based on data quality
  const isOfflineData = metrics.device_online === false
  const hasEnergyMonitoring = metrics.has_energy_monitoring !== false
  const cardBorderClass = isOfflineData 
    ? 'border-orange-200 bg-orange-50/30' 
    : hasEnergyMonitoring 
      ? 'border-green-200 bg-green-50/30' 
      : 'border-gray-200 bg-gray-50/30'

  return (
    <Card className={`transition-all duration-200 shadow-sm ${className} ${cardBorderClass} ${isRefetching ? 'ring-2 ring-blue-200' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <EnergyIcon />
          Messwerte
          <div className="ml-auto flex items-center gap-2">
            {/* Status indicator */}
            {isOfflineData && (
              <Badge variant="warning" className="text-xs">
                Offline
              </Badge>
            )}
            {!hasEnergyMonitoring && (
              <Badge variant="secondary" className="text-xs">
                Basis
              </Badge>
            )}
            {hasEnergyMonitoring && !isOfflineData && (
              <Badge variant="success" className="text-xs">
                Live
              </Badge>
            )}
            
            {/* Refresh indicator */}
            {(isRefetching || isManualRefresh) && (
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
            
            {/* Manual refresh button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isManualRefresh}
              className="h-6 w-6 p-1 hover:bg-gray-100"
              title="Daten aktualisieren"
            >
              {isManualRefresh ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshIcon />
              )}
            </Button>
            
            {/* Timestamp */}
            <Badge variant="outline" className="text-xs">
              {formatTime(metrics.last_update || metrics.lastUpdate)}
            </Badge>
          </div>
        </CardTitle>
        
        {/* Optional message */}
        {metrics.message && (
          <p className="text-xs text-gray-500 mt-1">
            {metrics.message}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Spannung */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-100 rounded-lg">
              <VoltageIcon />
            </div>
            <span className="text-sm font-medium text-gray-700">Spannung</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {metrics.voltage?.toFixed(1) || '0.0'}
            </div>
            <div className="text-xs text-gray-500">V</div>
          </div>
        </div>

        {/* Strom */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <CurrentIcon />
            </div>
            <span className="text-sm font-medium text-gray-700">Strom</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {metrics.current?.toFixed(3) || '0.000'}
            </div>
            <div className="text-xs text-gray-500">A</div>
          </div>
        </div>

        {/* Leistung */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <PowerIcon />
            </div>
            <span className="text-sm font-medium text-gray-700">Leistung</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {metrics.power?.toFixed(1) || '0.0'}
            </div>
            <div className="text-xs text-gray-500">W</div>
          </div>
        </div>

        {/* Leistungsfaktor - only show if we have real energy monitoring */}
        {hasEnergyMonitoring && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <EnergyIcon />
              </div>
              <span className="text-sm font-medium text-gray-700">Faktor</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {metrics.factor?.toFixed(2) || '1.00'}
              </div>
              <div className="text-xs text-gray-500">cos φ</div>
            </div>
          </div>
        )}

        {/* Energie heute/gestern - only show if meaningful */}
        {(metrics.today > 0 || metrics.yesterday > 0 || hasEnergyMonitoring) && (
          <div className="pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">
                  {((metrics.today || 0) / 1000).toFixed(2)} kWh
                </div>
                <div className="text-xs text-gray-500">Heute</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">
                  {((metrics.yesterday || 0) / 1000).toFixed(2)} kWh
                </div>
                <div className="text-xs text-gray-500">Gestern</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 