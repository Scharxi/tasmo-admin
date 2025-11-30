import { EventEmitter } from 'events';
import {
  DiscoveryDevice,
  DeviceConfig,
  SDKOptions,
} from '../types';
import { TasmotaError } from '../errors';
import { TasmotaHttpClient } from '../utils/http-client';
import {
  transformToDiscoveryDevice,
  generateIpRange,
  normalizeIpAddress,
  isValidIpAddress,
} from '../utils/transformers';

/**
 * Discovery options
 */
export interface DiscoveryOptions {
  /** Network to scan (e.g., "192.168.1.0/24" or "192.168.1.1") */
  network?: string;
  /** IP range start (default: 1) */
  startIp?: number;
  /** IP range end (default: 254) */
  endIp?: number;
  /** Specific IP addresses to scan */
  ipAddresses?: string[];
  /** Timeout per device (default: 3000ms) */
  timeout?: number;
  /** Maximum concurrent scans (default: 50) */
  concurrency?: number;
  /** Include offline devices in results (default: false) */
  includeOffline?: boolean;
}

/**
 * Discovery result
 */
export interface DiscoveryResult {
  devices: DiscoveryDevice[];
  totalScanned: number;
  totalFound: number;
  duration: number;
  errors: Array<{ ip: string; error: string }>;
}

/**
 * Discovery events
 */
export interface DiscoveryEvents {
  'device-found': (device: DiscoveryDevice) => void;
  'scan-progress': (progress: { scanned: number; total: number; current: string }) => void;
  'scan-complete': (result: DiscoveryResult) => void;
  'error': (error: TasmotaError) => void;
}

/**
 * Device discovery class for finding Tasmota devices on the network
 */
export class TasmotaDeviceDiscovery extends EventEmitter {
  private readonly options: Required<SDKOptions>;
  private isScanning = false;
  private scanAbortController?: AbortController;

  constructor(options?: SDKOptions) {
    super();
    this.options = {
      defaultTimeout: options?.defaultTimeout ?? 5000,
      retryAttempts: options?.retryAttempts ?? 3,
      retryDelay: options?.retryDelay ?? 1000,
      discoveryTimeout: options?.discoveryTimeout ?? 10000,
      validateResponses: options?.validateResponses ?? true,
    };
  }

  /**
   * Discover Tasmota devices on the network
   */
  async discover(options: DiscoveryOptions = {}): Promise<DiscoveryResult> {
    if (this.isScanning) {
      throw TasmotaError.validationError('Discovery scan is already in progress');
    }

    this.isScanning = true;
    this.scanAbortController = new AbortController();
    
    const startTime = Date.now();
    const devices: DiscoveryDevice[] = [];
    const errors: Array<{ ip: string; error: string }> = [];
    
    try {
      const ipAddresses = this.generateIpList(options);
      const timeout = options.timeout ?? 3000;
      const concurrency = Math.min(options.concurrency ?? 50, 100);
      
      let scanned = 0;
      const total = ipAddresses.length;
      
      // Process IPs in batches to control concurrency
      for (let i = 0; i < ipAddresses.length; i += concurrency) {
        if (this.scanAbortController.signal.aborted) {
          break;
        }
        
        const batch = ipAddresses.slice(i, i + concurrency);
        const promises = batch.map(async (ip) => {
          try {
            this.emit('scan-progress', { scanned, total, current: ip });
            
            const device = await this.scanDevice(ip, timeout);
            if (device) {
              devices.push(device);
              this.emit('device-found', device);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors.push({ ip, error: errorMessage });
          } finally {
            scanned++;
          }
        });
        
        await Promise.all(promises);
      }
      
      const result: DiscoveryResult = {
        devices,
        totalScanned: scanned,
        totalFound: devices.length,
        duration: Date.now() - startTime,
        errors,
      };
      
      this.emit('scan-complete', result);
      return result;
      
    } catch (error) {
      const tasmotaError = TasmotaError.fromUnknown(error);
      this.emit('error', tasmotaError);
      throw tasmotaError;
    } finally {
      this.isScanning = false;
      this.scanAbortController = undefined;
    }
  }

  /**
   * Discover devices by scanning a specific network range
   */
  async discoverByNetwork(network: string, options: Omit<DiscoveryOptions, 'network'> = {}): Promise<DiscoveryResult> {
    return this.discover({ ...options, network });
  }

  /**
   * Discover devices by scanning specific IP addresses
   */
  async discoverByIps(ipAddresses: string[], options: Omit<DiscoveryOptions, 'ipAddresses'> = {}): Promise<DiscoveryResult> {
    return this.discover({ ...options, ipAddresses });
  }

  /**
   * Quick discovery on common networks
   */
  async quickDiscover(options: Omit<DiscoveryOptions, 'network'> = {}): Promise<DiscoveryResult> {
    // Try to detect current network
    const currentNetwork = await this.detectCurrentNetwork();
    return this.discover({ ...options, network: currentNetwork });
  }

  /**
   * Scan a single device to check if it's a Tasmota device
   */
  async scanDevice(ip: string, timeout = 3000): Promise<DiscoveryDevice | null> {
    if (!isValidIpAddress(ip)) {
      throw TasmotaError.validationError(`Invalid IP address: ${ip}`);
    }

    const config: DeviceConfig = {
      host: ip,
      port: 80,
      timeout,
    };

    const client = new TasmotaHttpClient(config);
    
    try {
      // Quick ping first
      const isReachable = await client.ping();
      if (!isReachable) {
        return null;
      }

      // Get device info
      const statusData = await client.getStatus(0);
      return transformToDiscoveryDevice(ip, statusData);
      
    } catch (error) {
      // Device is not a Tasmota device or not reachable
      if (TasmotaError.isTasmotaError(error)) {
        if (error.type === 'DEVICE_NOT_FOUND' || error.type === 'TIMEOUT_ERROR') {
          return null;
        }
      }
      throw error;
    } finally {
      client.destroy();
    }
  }

  /**
   * Check if a device is a Tasmota device
   */
  async isTasmotaDevice(ip: string, timeout = 3000): Promise<boolean> {
    try {
      const device = await this.scanDevice(ip, timeout);
      return device !== null;
    } catch {
      return false;
    }
  }

  /**
   * Stop the current discovery scan
   */
  stopScan(): void {
    if (this.isScanning && this.scanAbortController) {
      this.scanAbortController.abort();
    }
  }

  /**
   * Check if a scan is currently in progress
   */
  isScanInProgress(): boolean {
    return this.isScanning;
  }

  /**
   * Generate list of IP addresses to scan
   */
  private generateIpList(options: DiscoveryOptions): string[] {
    if (options.ipAddresses) {
      return options.ipAddresses.filter(isValidIpAddress);
    }

    let baseIp = options.network;
    
    if (!baseIp) {
      // Default to common home network ranges
      baseIp = '192.168.1.0';
    }

    // Handle CIDR notation
    if (baseIp.includes('/')) {
      baseIp = baseIp.split('/')[0];
    }

    const normalizedIp = normalizeIpAddress(baseIp);
    const startIp = options.startIp ?? 1;
    const endIp = options.endIp ?? 254;

    return generateIpRange(normalizedIp, startIp, endIp);
  }

  /**
   * Attempt to detect the current network
   */
  private async detectCurrentNetwork(): Promise<string> {
    // This is a simplified implementation
    // In a real scenario, you might use network interfaces or other methods
    return '192.168.1.0';
  }

  /**
   * Typed event emitter methods
   */
  on<K extends keyof DiscoveryEvents>(event: K, listener: DiscoveryEvents[K]): this {
    return super.on(event, listener);
  }

  emit<K extends keyof DiscoveryEvents>(event: K, ...args: Parameters<DiscoveryEvents[K]>): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Create a discovery instance with default options
   */
  static create(options?: SDKOptions): TasmotaDeviceDiscovery {
    return new TasmotaDeviceDiscovery(options);
  }

  /**
   * Quick static method to discover devices
   */
  static async discover(options: DiscoveryOptions = {}): Promise<DiscoveryResult> {
    const discovery = new TasmotaDeviceDiscovery();
    return discovery.discover(options);
  }

  /**
   * Quick static method to scan a single device
   */
  static async scanDevice(ip: string, timeout = 3000): Promise<DiscoveryDevice | null> {
    const discovery = new TasmotaDeviceDiscovery();
    return discovery.scanDevice(ip, timeout);
  }

  /**
   * Quick static method to check if device is Tasmota
   */
  static async isTasmotaDevice(ip: string, timeout = 3000): Promise<boolean> {
    const discovery = new TasmotaDeviceDiscovery();
    return discovery.isTasmotaDevice(ip, timeout);
  }
}
