// Basic className utility without external dependencies
export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ')
}

export function formatEnergy(watts: number): string {
  if (watts >= 1000) {
    return `${(watts / 1000).toFixed(1)}kW`
  }
  return `${watts.toFixed(1)}W`
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) {
    return `${days}d ${hours}h`
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function getDeviceStatusColor(isOnline: boolean, powerState: boolean): string {
  if (!isOnline) return "text-gray-500"
  return powerState ? "text-green-500" : "text-orange-500"
}

export function getDeviceStatusText(isOnline: boolean, powerState: boolean): string {
  if (!isOnline) return "Offline"
  return powerState ? "On" : "Off"
} 