/**
 * Advanced usage examples for the Tasmota SDK
 * 
 * This file demonstrates advanced patterns, custom implementations,
 * and real-world use cases for the Tasmota SDK.
 */

import {
  TasmotaDevice,
  TasmotaSDK,
  TasmotaDeviceDiscovery,
  TasmotaError,
  createSDK,
  createDevice,
  DeviceConfig,
  PowerState,
  EnergyData,
  BulkOperationResult,
} from '../index';

/**
 * Example 1: Smart Home Automation System
 * 
 * A complete smart home controller that manages lights, switches, and monitoring
 */
class SmartHomeController {
  private sdk: TasmotaSDK;
  private devices: Map<string, { type: 'light' | 'switch' | 'sensor'; device: TasmotaDevice }> = new Map();

  constructor() {
    this.sdk = createSDK({
      defaultTimeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000,
      discoveryTimeout: 10000,
      validateResponses: true,
    });

    this.setupEventHandlers();
  }

  /**
   * Initialize the smart home system
   */
  async initialize(): Promise<void> {
    console.log('🏠 Initializing Smart Home Controller...');

    try {
      // Discover all Tasmota devices on the network
      const discoveryResult = await this.sdk.discoverAndAddDevices({
        network: '192.168.1.0',
        startIp: 1,
        endIp: 254,
        timeout: 3000,
        concurrency: 20,
      });

      console.log(`Discovered ${discoveryResult.totalFound} devices`);

      // Categorize devices based on their friendly names or capabilities
      await this.categorizeDevices();

      // Start health monitoring
      this.sdk.startHealthCheck(60000); // Check every minute

      console.log('✅ Smart Home Controller initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Smart Home Controller:', error);
      throw error;
    }
  }

  /**
   * Categorize devices based on their capabilities
   */
  private async categorizeDevices(): Promise<void> {
    const deviceIds = this.sdk.getDeviceIds();

    for (const deviceId of deviceIds) {
      const device = this.sdk.getDevice(deviceId);
      if (!device) continue;

      try {
        const deviceInfo = await device.getDeviceInfo();
        const supportsEnergy = await device.supportsEnergyMonitoring();

        // Determine device type based on friendly name and capabilities
        let deviceType: 'light' | 'switch' | 'sensor' = 'switch';

        if (deviceInfo.friendlyName.some(name => 
          name.toLowerCase().includes('light') || 
          name.toLowerCase().includes('lamp') ||
          name.toLowerCase().includes('bulb')
        )) {
          deviceType = 'light';
        } else if (supportsEnergy) {
          deviceType = 'sensor';
        }

        this.devices.set(deviceId, { type: deviceType, device });
        console.log(`Categorized ${deviceId} as ${deviceType}`);

      } catch (error) {
        console.warn(`Failed to categorize device ${deviceId}:`, error);
      }
    }
  }

  /**
   * Turn on all lights
   */
  async turnOnAllLights(): Promise<BulkOperationResult<PowerState | undefined>> {
    const lightIds = Array.from(this.devices.entries())
      .filter(([, info]) => info.type === 'light')
      .map(([id]) => id);

    console.log(`Turning on ${lightIds.length} lights...`);
    return this.sdk.sendCommandToDevices(lightIds, 'Power ON');
  }

  /**
   * Turn off all lights
   */
  async turnOffAllLights(): Promise<BulkOperationResult<PowerState | undefined>> {
    const lightIds = Array.from(this.devices.entries())
      .filter(([, info]) => info.type === 'light')
      .map(([id]) => id);

    console.log(`Turning off ${lightIds.length} lights...`);
    return this.sdk.sendCommandToDevices(lightIds, 'Power OFF');
  }

  /**
   * Get energy consumption for all monitoring devices
   */
  async getEnergyConsumption(): Promise<Map<string, EnergyData | null>> {
    const energyData = new Map<string, EnergyData | null>();
    const sensorIds = Array.from(this.devices.entries())
      .filter(([, info]) => info.type === 'sensor')
      .map(([id]) => id);

    for (const deviceId of sensorIds) {
      const device = this.sdk.getDevice(deviceId);
      if (device) {
        try {
          const energy = await device.getEnergyData();
          energyData.set(deviceId, energy);
        } catch (error) {
          console.warn(`Failed to get energy data for ${deviceId}:`, error);
          energyData.set(deviceId, null);
        }
      }
    }

    return energyData;
  }

  /**
   * Create a lighting scene
   */
  async setLightingScene(scene: 'morning' | 'evening' | 'night' | 'off'): Promise<void> {
    console.log(`Setting lighting scene: ${scene}`);

    const lightIds = Array.from(this.devices.entries())
      .filter(([, info]) => info.type === 'light')
      .map(([id]) => id);

    switch (scene) {
      case 'morning':
        // Turn on all lights
        await this.sdk.sendCommandToDevices(lightIds, 'Power ON');
        break;
      
      case 'evening':
        // Turn on main lights, dim others (if supported)
        await this.sdk.sendCommandToDevices(lightIds, 'Power ON');
        // Note: Dimming would require checking device capabilities
        break;
      
      case 'night':
        // Turn on only essential lights at low brightness
        const essentialLights = lightIds.slice(0, Math.ceil(lightIds.length / 3));
        await this.sdk.sendCommandToDevices(essentialLights, 'Power ON');
        break;
      
      case 'off':
        // Turn off all lights
        await this.sdk.sendCommandToDevices(lightIds, 'Power OFF');
        break;
    }
  }

  /**
   * Schedule automatic operations
   */
  startScheduler(): void {
    console.log('Starting automated scheduler...');

    // Morning routine - 7:00 AM
    this.scheduleDaily('07:00', async () => {
      console.log('🌅 Running morning routine...');
      await this.setLightingScene('morning');
    });

    // Evening routine - 6:00 PM
    this.scheduleDaily('18:00', async () => {
      console.log('🌆 Running evening routine...');
      await this.setLightingScene('evening');
    });

    // Night routine - 10:00 PM
    this.scheduleDaily('22:00', async () => {
      console.log('🌙 Running night routine...');
      await this.setLightingScene('night');
    });

    // Energy monitoring - every hour
    setInterval(async () => {
      const energyData = await this.getEnergyConsumption();
      console.log('⚡ Energy consumption update:', energyData.size, 'devices monitored');
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Schedule a daily task
   */
  private scheduleDaily(time: string, task: () => Promise<void>): void {
    const [hours, minutes] = time.split(':').map(Number);
    
    const schedule = () => {
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const delay = scheduledTime.getTime() - now.getTime();
      
      setTimeout(async () => {
        try {
          await task();
        } catch (error) {
          console.error(`Scheduled task failed at ${time}:`, error);
        }
        schedule(); // Schedule next occurrence
      }, delay);
    };
    
    schedule();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.sdk.on('device-online', (deviceId) => {
      console.log(`📡 Device ${deviceId} came online`);
    });

    this.sdk.on('device-offline', (deviceId) => {
      console.log(`📴 Device ${deviceId} went offline`);
    });

    this.sdk.on('error', (error) => {
      console.error('🚨 SDK Error:', error.getUserFriendlyMessage());
    });
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<{
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    devicesByType: Record<string, number>;
    totalEnergyConsumption: number;
  }> {
    const totalDevices = this.sdk.getDeviceCount();
    const onlineDevices = this.sdk.getOnlineDevices().length;
    const offlineDevices = this.sdk.getOfflineDevices().length;

    const devicesByType: Record<string, number> = {};
    for (const [, info] of this.devices) {
      devicesByType[info.type] = (devicesByType[info.type] || 0) + 1;
    }

    const energyData = await this.getEnergyConsumption();
    const totalEnergyConsumption = Array.from(energyData.values())
      .reduce((total, data) => total + (data?.power || 0), 0);

    return {
      totalDevices,
      onlineDevices,
      offlineDevices,
      devicesByType,
      totalEnergyConsumption,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.sdk.destroy();
    this.devices.clear();
  }
}

/**
 * Example 2: Custom Device Class with Extended Functionality
 * 
 * Shows how to extend the basic TasmotaDevice for specific use cases
 */
class SmartSwitch extends TasmotaDevice {
  private lastToggleTime = 0;
  private toggleCount = 0;

  constructor(config: DeviceConfig, private readonly switchName: string) {
    super(config);
  }

  /**
   * Smart toggle with debouncing and counting
   */
  async smartToggle(): Promise<PowerState> {
    const now = Date.now();
    
    // Debounce: prevent rapid toggling
    if (now - this.lastToggleTime < 1000) {
      console.warn(`Debounced toggle for ${this.switchName}`);
      return this.getPowerState();
    }

    this.lastToggleTime = now;
    this.toggleCount++;

    console.log(`Smart toggle #${this.toggleCount} for ${this.switchName}`);
    return this.toggle();
  }

  /**
   * Schedule automatic turn-off after delay
   */
  async turnOnWithAutoOff(delayMs: number): Promise<void> {
    await this.turnOn();
    console.log(`${this.switchName} will turn off automatically in ${delayMs}ms`);

    setTimeout(async () => {
      try {
        await this.turnOff();
        console.log(`${this.switchName} automatically turned off`);
      } catch (error) {
        console.error(`Failed to auto-turn-off ${this.switchName}:`, error);
      }
    }, delayMs);
  }

  /**
   * Get switch statistics
   */
  getStatistics(): { name: string; toggleCount: number; lastToggleTime: number } {
    return {
      name: this.switchName,
      toggleCount: this.toggleCount,
      lastToggleTime: this.lastToggleTime,
    };
  }
}

/**
 * Example 3: Advanced Discovery with Custom Filtering
 * 
 * Shows how to implement custom discovery logic
 */
class AdvancedDiscovery extends TasmotaDeviceDiscovery {
  /**
   * Discover devices with custom filtering
   */
  async discoverWithFilter(
    filter: (deviceInfo: any) => boolean,
    networkRange: string = '192.168.1.0'
  ): Promise<TasmotaDevice[]> {
    console.log('🔍 Starting advanced discovery with filtering...');

    const devices: TasmotaDevice[] = [];

    // Discover all devices first
    const result = await this.discover({
      network: networkRange,
      timeout: 3000,
      concurrency: 25,
    });

    console.log(`Found ${result.devices.length} potential devices`);

    // Filter and create device instances
    for (const discoveredDevice of result.devices) {
      try {
        // Create temporary device to get detailed info
        const tempDevice = createDevice(discoveredDevice.ipAddress);
        const deviceInfo = await tempDevice.getDeviceInfo();
        
        // Apply custom filter
        if (filter(deviceInfo)) {
          devices.push(tempDevice);
          console.log(`✅ Device ${discoveredDevice.ipAddress} passed filter`);
        } else {
          tempDevice.destroy();
          console.log(`❌ Device ${discoveredDevice.ipAddress} filtered out`);
        }
      } catch (error) {
        console.warn(`Failed to filter device ${discoveredDevice.ipAddress}:`, error);
      }
    }

    console.log(`Advanced discovery completed: ${devices.length} devices match filter`);
    return devices;
  }

  /**
   * Discover devices by version range
   */
  async discoverByVersion(minVersion: string, maxVersion?: string): Promise<TasmotaDevice[]> {
    return this.discoverWithFilter((deviceInfo) => {
      const version = deviceInfo.version;
      const isAboveMin = this.compareVersions(version, minVersion) >= 0;
      const isBelowMax = !maxVersion || this.compareVersions(version, maxVersion) <= 0;
      return isAboveMin && isBelowMax;
    });
  }

  /**
   * Discover devices by friendly name pattern
   */
  async discoverByNamePattern(pattern: RegExp): Promise<TasmotaDevice[]> {
    return this.discoverWithFilter((deviceInfo) => {
      return deviceInfo.friendlyName.some((name: string) => pattern.test(name));
    });
  }

  /**
   * Simple version comparison
   */
  private compareVersions(version1: string, version2: string): number {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    const maxLength = Math.max(v1parts.length, v2parts.length);

    for (let i = 0; i < maxLength; i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part > v2part) return 1;
      if (v1part < v2part) return -1;
    }
    
    return 0;
  }
}

/**
 * Example 4: Device Group Management
 * 
 * Shows how to group and manage devices together
 */
class DeviceGroup {
  private devices: Map<string, TasmotaDevice> = new Map();

  constructor(private readonly groupName: string) {}

  /**
   * Add device to group
   */
  addDevice(id: string, device: TasmotaDevice): void {
    this.devices.set(id, device);
    console.log(`Added device ${id} to group ${this.groupName}`);
  }

  /**
   * Remove device from group
   */
  removeDevice(id: string): boolean {
    const removed = this.devices.delete(id);
    if (removed) {
      console.log(`Removed device ${id} from group ${this.groupName}`);
    }
    return removed;
  }

  /**
   * Execute command on all devices in group
   */
  async executeOnAll<T>(
    operation: (device: TasmotaDevice) => Promise<T>
  ): Promise<Map<string, { success: boolean; result?: T; error?: Error }>> {
    const results = new Map<string, { success: boolean; result?: T; error?: Error }>();

    const promises = Array.from(this.devices.entries()).map(async ([id, device]) => {
      try {
        const result = await operation(device);
        results.set(id, { success: true, result });
      } catch (error) {
        results.set(id, { success: false, error: error as Error });
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Turn on all devices in group
   */
  async turnOnAll(): Promise<void> {
    console.log(`Turning on all devices in group ${this.groupName}`);
    const results = await this.executeOnAll(device => device.turnOn());
    
    const successful = Array.from(results.values()).filter(r => r.success).length;
    console.log(`Group ${this.groupName}: ${successful}/${this.devices.size} devices turned on`);
  }

  /**
   * Get group status
   */
  async getGroupStatus(): Promise<{
    groupName: string;
    deviceCount: number;
    onlineCount: number;
    powerStates: Map<string, PowerState | null>;
  }> {
    const powerStates = new Map<string, PowerState | null>();
    let onlineCount = 0;

    const results = await this.executeOnAll(async device => {
      const isOnline = await device.ping();
      if (isOnline) {
        onlineCount++;
        return device.getPowerState();
      }
      return null;
    });

    for (const [id, result] of results) {
      powerStates.set(id, result.success ? result.result || null : null);
    }

    return {
      groupName: this.groupName,
      deviceCount: this.devices.size,
      onlineCount,
      powerStates,
    };
  }

  /**
   * Get device count
   */
  getDeviceCount(): number {
    return this.devices.size;
  }

  /**
   * Get all device IDs
   */
  getDeviceIds(): string[] {
    return Array.from(this.devices.keys());
  }
}

/**
 * Example usage of advanced features
 */
async function runAdvancedExamples(): Promise<void> {
  console.log('🚀 Advanced Tasmota SDK Examples');
  console.log('=================================\n');

  try {
    // Example 1: Smart Home Controller
    console.log('1. Smart Home Controller Example');
    const smartHome = new SmartHomeController();
    await smartHome.initialize();
    
    // Set a lighting scene
    await smartHome.setLightingScene('evening');
    
    // Get system status
    const status = await smartHome.getSystemStatus();
    console.log('System Status:', status);
    
    // Start scheduler (commented out for demo)
    // smartHome.startScheduler();
    
    smartHome.destroy();

    // Example 2: Custom Smart Switch
    console.log('\n2. Custom Smart Switch Example');
    const smartSwitch = new SmartSwitch(
      { host: '192.168.1.100', port: 80, timeout: 5000 },
      'Living Room Light'
    );
    
    await smartSwitch.smartToggle();
    await smartSwitch.turnOnWithAutoOff(5000); // Auto-off after 5 seconds
    
    const stats = smartSwitch.getStatistics();
    console.log('Switch Statistics:', stats);
    
    smartSwitch.destroy();

    // Example 3: Advanced Discovery
    console.log('\n3. Advanced Discovery Example');
    const advancedDiscovery = new AdvancedDiscovery();
    
    // Discover devices with version >= 9.0.0
    const modernDevices = await advancedDiscovery.discoverByVersion('9.0.0');
    console.log(`Found ${modernDevices.length} modern devices`);
    
    // Discover devices with "Light" in their name
    const lightDevices = await advancedDiscovery.discoverByNamePattern(/light/i);
    console.log(`Found ${lightDevices.length} light devices`);
    
    // Clean up
    [...modernDevices, ...lightDevices].forEach(device => device.destroy());

    // Example 4: Device Groups
    console.log('\n4. Device Group Example');
    const livingRoomGroup = new DeviceGroup('Living Room');
    const kitchenGroup = new DeviceGroup('Kitchen');
    
    // Add devices to groups (assuming they exist)
    try {
      const device1 = createDevice('192.168.1.100');
      const device2 = createDevice('192.168.1.101');
      
      livingRoomGroup.addDevice('light1', device1);
      kitchenGroup.addDevice('light2', device2);
      
      // Control groups
      await livingRoomGroup.turnOnAll();
      
      // Get group status
      const livingRoomStatus = await livingRoomGroup.getGroupStatus();
      console.log('Living Room Status:', livingRoomStatus);
      
      // Clean up
      device1.destroy();
      device2.destroy();
    } catch (error) {
      console.log('Skipping device group demo (devices not available)');
    }

    console.log('\n✅ All advanced examples completed!');

  } catch (error) {
    console.error('\n❌ Advanced examples failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAdvancedExamples().catch(console.error);
}

export {
  SmartHomeController,
  SmartSwitch,
  AdvancedDiscovery,
  DeviceGroup,
  runAdvancedExamples,
};
