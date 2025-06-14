import { NextRequest, NextResponse } from 'next/server'
import { getDeviceStatus, transformDeviceData } from '@/lib/tasmota-config'

// Function to generate IP addresses from a range
function generateIPRange(startIP: string, endIP: string): string[] {
  const ips: string[] = []
  
  // Parse IP addresses
  const parseIP = (ip: string) => ip.split('.').map(Number)
  const formatIP = (parts: number[]) => parts.join('.')
  
  const start = parseIP(startIP)
  const end = parseIP(endIP)
  
  // Validate IP format
  if (start.length !== 4 || end.length !== 4) {
    throw new Error('Invalid IP address format')
  }
  
  // Simple range generation - assumes same network (first 3 octets)
  if (start[0] !== end[0] || start[1] !== end[1] || start[2] !== end[2]) {
    // Cross-network range generation
    for (let a = start[0]; a <= end[0]; a++) {
      for (let b = (a === start[0] ? start[1] : 0); b <= (a === end[0] ? end[1] : 255); b++) {
        for (let c = (a === start[0] && b === start[1] ? start[2] : 0); c <= (a === end[0] && b === end[1] ? end[2] : 255); c++) {
          for (let d = (a === start[0] && b === start[1] && c === start[2] ? start[3] : 1); d <= (a === end[0] && b === end[1] && c === end[2] ? end[3] : 254); d++) {
            ips.push(formatIP([a, b, c, d]))
          }
        }
      }
    }
  } else {
    // Same network - simple range
    for (let i = start[3]; i <= end[3]; i++) {
      ips.push(formatIP([start[0], start[1], start[2], i]))
    }
  }
  
  return ips
}

// Function to parse CIDR notation
function parseCIDR(cidr: string): string[] {
  const [network, prefixStr] = cidr.split('/')
  const prefix = parseInt(prefixStr)
  
  if (prefix < 0 || prefix > 32) {
    throw new Error('Invalid CIDR prefix')
  }
  
  const networkParts = network.split('.').map(Number)
  if (networkParts.length !== 4) {
    throw new Error('Invalid network address')
  }
  
  const hostBits = 32 - prefix
  const numHosts = Math.pow(2, hostBits) - 2 // Exclude network and broadcast
  
  const ips: string[] = []
  const networkInt = (networkParts[0] << 24) + (networkParts[1] << 16) + (networkParts[2] << 8) + networkParts[3]
  
  for (let i = 1; i <= numHosts; i++) {
    const hostInt = networkInt + i
    const ip = [
      (hostInt >> 24) & 255,
      (hostInt >> 16) & 255,
      (hostInt >> 8) & 255,
      hostInt & 255
    ].join('.')
    ips.push(ip)
  }
  
  return ips
}

// Quick HTTP check to see if anything is responding on port 80
async function quickHttpCheck(ipAddress: string): Promise<boolean> {
  try {
    const response = await fetch(`http://${ipAddress}/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(1000), // Very short timeout for quick check
    })
    return response.ok || response.status < 500 // Accept any response that's not a server error
  } catch (error) {
    return false
  }
}

// Function to discover a device and transform its data
async function discoverDevice(ipAddress: string): Promise<any | null> {
  // First, do a quick HTTP check to see if anything is responding
  const isReachable = await quickHttpCheck(ipAddress)
  if (!isReachable) {
    return null // Skip Tasmota-specific checks if nothing responds on HTTP
  }
  
  // If something responded, try Tasmota-specific discovery
  const deviceData = await getDeviceStatus(ipAddress, 2000) // Shorter timeout since we know it's reachable
  if (!deviceData) return null
  
  return transformDeviceData(deviceData, ipAddress)
}

// POST /api/devices/discover - Discover available Tasmota devices in IP range
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { range, maxConcurrency = 20 } = body
    
    if (!range) {
      return NextResponse.json(
        { error: 'IP range is required' },
        { status: 400 }
      )
    }
    
    console.log(`Starting device discovery for range: ${range}`)
    
    let ipAddresses: string[] = []
    
    // Parse different range formats
    if (range.includes('/')) {
      // CIDR notation (e.g., 192.168.1.0/24)
      ipAddresses = parseCIDR(range)
    } else if (range.includes('-')) {
      // Range notation (e.g., 192.168.1.1-192.168.1.254)
      const [startIP, endIP] = range.split('-').map((ip: string) => ip.trim())
      ipAddresses = generateIPRange(startIP, endIP)
    } else {
      // Single IP
      ipAddresses = [range]
    }
    
    console.log(`Generated ${ipAddresses.length} IP addresses to scan`)
    
    if (ipAddresses.length > 1000) {
      return NextResponse.json(
        { error: 'IP range too large. Maximum 1000 addresses allowed.' },
        { status: 400 }
      )
    }
    
    // Process IPs in batches to avoid overwhelming the network
    const discoveredDevices: any[] = []
    const batchSize = Math.min(maxConcurrency, 50) // Increased batch size since we do quick checks first
    
    for (let i = 0; i < ipAddresses.length; i += batchSize) {
      const batch = ipAddresses.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(ipAddresses.length / batchSize)
      
      console.log(`Processing batch ${batchNumber}/${totalBatches} (IPs ${i + 1}-${Math.min(i + batchSize, ipAddresses.length)} of ${ipAddresses.length})`)
      
      const discoveryPromises = batch.map(ip => discoverDevice(ip))
      const results = await Promise.all(discoveryPromises)
      
      // Filter out null results (offline devices)
      const batchDevices = results.filter(device => device !== null)
      discoveredDevices.push(...batchDevices)
      
      if (batchDevices.length > 0) {
        console.log(`Found ${batchDevices.length} device(s) in batch ${batchNumber}`)
      }
      
      // Small delay between batches to be network-friendly, but smaller since we're doing quicker checks
      if (i + batchSize < ipAddresses.length) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    console.log(`Discovery complete. Found ${discoveredDevices.length} devices out of ${ipAddresses.length} IPs scanned.`)
    
    return NextResponse.json({
      discoveredDevices,
      totalScanned: ipAddresses.length,
      totalFound: discoveredDevices.length
    })
  } catch (error) {
    console.error('Error during device discovery:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to discover devices' },
      { status: 500 }
    )
  }
} 