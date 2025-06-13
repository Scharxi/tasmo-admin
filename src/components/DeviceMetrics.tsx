'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDeviceMetrics } from '@/hooks/useDevices'
import { Skeleton } from './ui/skeleton'

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

interface DeviceMetricsProps {
  deviceId: string
  className?: string
}

export function DeviceMetrics({ deviceId, className = '' }: DeviceMetricsProps) {
  const { data: metrics, isLoading, error, isRefetching } = useDeviceMetrics(deviceId)

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
            <EnergyIcon />
            Messwerte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-sm">Fehler beim Laden der Messwerte</p>
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

  return (
    <Card className={`bg-white/90 border-gray-200 shadow-sm transition-all duration-200 ${className} ${isRefetching ? 'ring-2 ring-blue-200' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <EnergyIcon />
          Messwerte
          <div className="ml-auto flex items-center gap-2">
            {isRefetching && (
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
            <Badge variant="outline" className="text-xs">
              {formatTime(metrics.lastUpdate)}
            </Badge>
          </div>
        </CardTitle>
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
              {metrics.voltage.toFixed(1)}
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
              {metrics.current.toFixed(3)}
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
              {metrics.power.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">W</div>
          </div>
        </div>

        {/* Leistungsfaktor */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <EnergyIcon />
            </div>
            <span className="text-sm font-medium text-gray-700">Faktor</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {metrics.factor.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">cos φ</div>
          </div>
        </div>

        {/* Energie heute/gestern */}
        <div className="pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">
                {(metrics.today / 1000).toFixed(2)} kWh
              </div>
              <div className="text-xs text-gray-500">Heute</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">
                {(metrics.yesterday / 1000).toFixed(2)} kWh
              </div>
              <div className="text-xs text-gray-500">Gestern</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 