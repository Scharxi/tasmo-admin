/**
 * Basic usage examples for the Tasmota SDK
 * 
 * This file demonstrates the fundamental operations you can perform
 * with Tasmota devices using this TypeScript SDK.
 */

import {
  TasmotaDevice,
  TasmotaSDK,
  createDevice,
  createSDK,
  discoverDevices,
  scanDevice,
  isTasmotaDevice,
  TasmotaError,
} from '../index';

/**
 * Example 1: Basic device control
 * 
 * Shows how to create a device instance and perform basic operations
 */
async function basicDeviceControl(): Promise<void> {
  try {
    console.log('=== Basic Device Control ===');
    
    // Create a device instance
    const device = createDevice('192.168.1.100', {
      timeout: 5000,
      username: 'admin', // Optional: if your device requires authentication
      password: 'password', // Optional: if your device requires authentication
    });

    // Test connection
    const isOnline = await device.ping();
    console.log(`Device is ${isOnline ? 'online' : 'offline'}`);

    if (!isOnline) {
      console.log('Device is not reachable');
      return;
    }

    // Get device information
    const deviceInfo = await device.getDeviceInfo();
    console.log('Device Info:', {
      hostname: deviceInfo.hostname,
      ipAddress: deviceInfo.ipAddress,
      version: deviceInfo.version,
      uptime: deviceInfo.uptime,
    });

    // Get current power state
    const powerState = await device.getPowerState();
    console.log(`Current power state: ${powerState}`);

    // Turn on the device
    const newState = await device.turnOn();
    console.log(`Device turned on: ${newState}`);

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Toggle the device
    const toggledState = await device.toggle();
    console.log(`Device toggled: ${toggledState}`);

    // Get power status for all relays
    const powerStatus = await device.getPowerStatus();
    console.log('Power Status:', powerStatus);

    // Check if device supports energy monitoring
    const supportsEnergy = await device.supportsEnergyMonitoring();
    console.log(`Energy monitoring supported: ${supportsEnergy}`);

    if (supportsEnergy) {
      const energyData = await device.getEnergyData();
      console.log('Energy Data:', energyData);
    }

    // Clean up
    device.destroy();

  } catch (error) {
    if (TasmotaError.isTasmotaError(error)) {
      console.error('Tasmota Error:', {
        type: error.type,
        message: error.message,
        userFriendlyMessage: error.getUserFriendlyMessage(),
      });
    } else {
      console.error('Unknown error:', error);
    }
  }
}

/**
 * Example 2: Multi-relay device control
 * 
 * Shows how to control devices with multiple relays
 */
async function multiRelayControl(): Promise<void> {
  try {
    console.log('\n=== Multi-Relay Device Control ===');
    
    const device = createDevice('192.168.1.101');

    // Get the number of relays
    const relayCount = await device.getRelayCount();
    console.log(`Device has ${relayCount} relay(s)`);

    // Control individual relays
    for (let relay = 1; relay <= relayCount; relay++) {
      console.log(`\nControlling relay ${relay}:`);
      
      // Get current state
      const currentState = await device.getPowerState(relay);
      console.log(`  Current state: ${currentState}`);
      
      // Toggle the relay
      const newState = await device.toggle(relay);
      console.log(`  New state: ${newState}`);
    }

    // Turn on all relays
    await device.turnOnAll();
    console.log('All relays turned on');

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Turn off all relays
    await device.turnOffAll();
    console.log('All relays turned off');

    device.destroy();

  } catch (error) {
    if (TasmotaError.isTasmotaError(error)) {
      console.error('Tasmota Error:', error.getUserFriendlyMessage());
    } else {
      console.error('Unknown error:', error);
    }
  }
}

/**
 * Example 3: Device discovery
 * 
 * Shows how to discover Tasmota devices on your network
 */
async function deviceDiscovery(): Promise<void> {
  try {
    console.log('\n=== Device Discovery ===');

    // Quick discovery on common network
    console.log('Starting network discovery...');
    const result = await discoverDevices({
      network: '192.168.1.0',
      startIp: 1,
      endIp: 50, // Scan only first 50 IPs for demo
      timeout: 3000,
      concurrency: 10,
    });

    console.log(`Discovery completed in ${result.duration}ms`);
    console.log(`Found ${result.totalFound} Tasmota devices out of ${result.totalScanned} scanned`);

    // List discovered devices
    result.devices.forEach((device, index) => {
      console.log(`\nDevice ${index + 1}:`);
      console.log(`  Hostname: ${device.hostname}`);
      console.log(`  IP Address: ${device.ipAddress}`);
      console.log(`  Friendly Name: ${device.friendlyName}`);
      console.log(`  Version: ${device.version}`);
      console.log(`  MAC Address: ${device.macAddress}`);
    });

    // Show any errors that occurred during discovery
    if (result.errors.length > 0) {
      console.log('\nErrors during discovery:');
      result.errors.slice(0, 5).forEach(error => { // Show only first 5 errors
        console.log(`  ${error.ip}: ${error.error}`);
      });
    }

  } catch (error) {
    console.error('Discovery failed:', error);
  }
}

/**
 * Example 4: Single device scanning
 * 
 * Shows how to check if a specific IP is a Tasmota device
 */
async function singleDeviceScanning(): Promise<void> {
  console.log('\n=== Single Device Scanning ===');

  const testIps = ['192.168.1.100', '192.168.1.101', '192.168.1.102'];

  for (const ip of testIps) {
    try {
      console.log(`\nChecking ${ip}...`);
      
      // Quick check if it's a Tasmota device
      const isTasmota = await isTasmotaDevice(ip, 2000);
      console.log(`  Is Tasmota device: ${isTasmota}`);

      if (isTasmota) {
        // Get detailed device information
        const deviceInfo = await scanDevice(ip, 3000);
        if (deviceInfo) {
          console.log(`  Hostname: ${deviceInfo.hostname}`);
          console.log(`  Friendly Name: ${deviceInfo.friendlyName}`);
          console.log(`  Version: ${deviceInfo.version}`);
        }
      }

    } catch (error) {
      console.log(`  Error scanning ${ip}: ${error}`);
    }
  }
}

/**
 * Example 5: SDK for managing multiple devices
 * 
 * Shows how to use the SDK to manage multiple devices simultaneously
 */
async function multiDeviceManagement(): Promise<void> {
  try {
    console.log('\n=== Multi-Device Management ===');

    // Create SDK instance
    const sdk = createSDK({
      defaultTimeout: 5000,
      retryAttempts: 2,
      retryDelay: 1000,
      discoveryTimeout: 2000,
      validateResponses: true,
    });

    // Add devices manually
    const device1Id = sdk.addDevice({ host: '192.168.1.100', port: 80, timeout: 5000 });
    const device2Id = sdk.addDevice({ host: '192.168.1.101', port: 80, timeout: 5000 });

    console.log(`Added devices: ${device1Id}, ${device2Id}`);

    // Or discover and add devices automatically
    console.log('Discovering and adding devices...');
    const discoveryResult = await sdk.discoverAndAddDevices({
      network: '192.168.1.0',
      startIp: 100,
      endIp: 110,
      timeout: 2000,
    });

    console.log(`Auto-discovered ${discoveryResult.totalFound} devices`);
    console.log(`Total devices in SDK: ${sdk.getDeviceCount()}`);

    // Ping all devices
    console.log('\nPinging all devices...');
    const pingResults = await sdk.pingAllDevices({ timeout: 3000 });
    console.log(`Ping results: ${pingResults.successCount} successful, ${pingResults.failureCount} failed`);

    // Turn on all devices
    console.log('\nTurning on all devices...');
    const turnOnResults = await sdk.turnOnAll();
    console.log(`Turn on results: ${turnOnResults.successCount} successful, ${turnOnResults.failureCount} failed`);

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send custom command to all devices
    console.log('\nSending status command to all devices...');
    const statusResults = await sdk.sendCommandToAll('Status');
    console.log(`Status command results: ${statusResults.successCount} successful, ${statusResults.failureCount} failed`);

    // Start health monitoring
    console.log('\nStarting health monitoring...');
    sdk.on('device-online', (deviceId) => {
      console.log(`Device ${deviceId} came online`);
    });

    sdk.on('device-offline', (deviceId) => {
      console.log(`Device ${deviceId} went offline`);
    });

    sdk.startHealthCheck(30000); // Check every 30 seconds

    // Let health check run for a bit (in real app, this would run continuously)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Clean up
    sdk.stopHealthCheck();
    sdk.destroy();

  } catch (error) {
    if (TasmotaError.isTasmotaError(error)) {
      console.error('SDK Error:', error.getUserFriendlyMessage());
    } else {
      console.error('Unknown error:', error);
    }
  }
}

/**
 * Example 6: Error handling
 * 
 * Shows comprehensive error handling patterns
 */
async function errorHandlingExamples(): Promise<void> {
  console.log('\n=== Error Handling Examples ===');

  // Example 1: Network timeout
  try {
    const device = createDevice('192.168.1.999', { timeout: 1000 }); // Non-existent IP
    await device.ping();
  } catch (error) {
    if (TasmotaError.isTasmotaError(error)) {
      console.log('Network Error Example:');
      console.log(`  Type: ${error.type}`);
      console.log(`  Message: ${error.message}`);
      console.log(`  User-friendly: ${error.getUserFriendlyMessage()}`);
      console.log(`  Device: ${error.deviceHost}`);
    }
  }

  // Example 2: Invalid command
  try {
    const device = createDevice('192.168.1.100');
    await device.sendCommand('InvalidCommand123');
  } catch (error) {
    if (TasmotaError.isTasmotaError(error)) {
      console.log('\nInvalid Command Example:');
      console.log(`  Type: ${error.type}`);
      console.log(`  Command: ${error.command}`);
      console.log(`  User-friendly: ${error.getUserFriendlyMessage()}`);
    }
  }

  // Example 3: Validation error
  try {
    const device = createDevice(''); // Invalid IP
  } catch (error) {
    if (TasmotaError.isTasmotaError(error)) {
      console.log('\nValidation Error Example:');
      console.log(`  Type: ${error.type}`);
      console.log(`  Message: ${error.message}`);
    }
  }
}

/**
 * Example 7: Advanced device operations
 * 
 * Shows advanced features and custom commands
 */
async function advancedOperations(): Promise<void> {
  try {
    console.log('\n=== Advanced Operations ===');

    const device = createDevice('192.168.1.100');

    // Custom command with retry options
    const result = await device.sendCommand('Status 0', {
      timeout: 10000,
      retries: 5,
      retryDelay: 2000,
    });

    if (result.success) {
      console.log('Custom command successful:', result.data);
    } else {
      console.log('Custom command failed:', result.error);
    }

    // Get device uptime
    const uptime = await device.getUptime();
    console.log(`Device uptime: ${uptime} seconds`);

    // Restart device (be careful with this!)
    // const restartResult = await device.restart();
    // console.log('Restart command sent:', restartResult.success);

    // Clear device info cache
    device.clearCache();
    console.log('Device cache cleared');

    // Force refresh device info
    const freshInfo = await device.getDeviceInfo({ forceRefresh: true });
    console.log('Fresh device info retrieved:', freshInfo.hostname);

    device.destroy();

  } catch (error) {
    if (TasmotaError.isTasmotaError(error)) {
      console.error('Advanced operations error:', error.getUserFriendlyMessage());
    } else {
      console.error('Unknown error:', error);
    }
  }
}

/**
 * Main function to run all examples
 */
async function runAllExamples(): Promise<void> {
  console.log('🚀 Tasmota SDK Examples');
  console.log('========================\n');

  try {
    await basicDeviceControl();
    await multiRelayControl();
    await deviceDiscovery();
    await singleDeviceScanning();
    await multiDeviceManagement();
    await errorHandlingExamples();
    await advancedOperations();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Example execution failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  basicDeviceControl,
  multiRelayControl,
  deviceDiscovery,
  singleDeviceScanning,
  multiDeviceManagement,
  errorHandlingExamples,
  advancedOperations,
  runAllExamples,
};
