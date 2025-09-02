/**
 * Performance profiling utility for adaptive concurrency and window sizing
 * Analyzes device/network capabilities to optimize feed loading performance
 */

interface ConnectionInfo {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
}

interface PerformanceProfile {
  fast: boolean;
  slow: boolean;
  maxConcurrent: number;
  windowSize: number;
  deviceCategory: 'low' | 'mid' | 'high';
  networkCategory: 'slow' | 'medium' | 'fast';
}

export function getPerfProfile(): PerformanceProfile {
  // Network Information API (Chrome/Edge)
  const navigatorWithConnection = navigator as typeof navigator & {
    connection?: ConnectionInfo;
    mozConnection?: ConnectionInfo;
    webkitConnection?: ConnectionInfo;
    deviceMemory?: number;
  };
  
  const connection = navigatorWithConnection.connection || 
                    navigatorWithConnection.mozConnection || 
                    navigatorWithConnection.webkitConnection;
  const connectionInfo: ConnectionInfo = connection || {};
  
  // Network metrics
  const downlink = connectionInfo.downlink ?? 10; // Mbps
  const effectiveType = connectionInfo.effectiveType ?? '4g';
  const rtt = connectionInfo.rtt ?? 50; // milliseconds
  const saveData = connectionInfo.saveData ?? false;
  
  // Device capabilities
  const deviceMemory = navigatorWithConnection.deviceMemory ?? 8; // GB
  const hardwareConcurrency = navigator.hardwareConcurrency ?? 8; // CPU cores
  
  // Network categorization
  let networkCategory: 'slow' | 'medium' | 'fast' = 'medium';
  if (effectiveType?.includes('2g') || downlink < 2 || rtt > 200 || saveData) {
    networkCategory = 'slow';
  } else if (effectiveType === '4g' && downlink >= 10 && rtt <= 100) {
    networkCategory = 'fast';
  }
  
  // Device categorization
  let deviceCategory: 'low' | 'mid' | 'high' = 'mid';
  if (deviceMemory <= 4 && hardwareConcurrency <= 4) {
    deviceCategory = 'low';
  } else if (deviceMemory >= 8 && hardwareConcurrency >= 8) {
    deviceCategory = 'high';
  }
  
  // Overall performance classification
  const fast = networkCategory === 'fast' && deviceCategory === 'high';
  const slow = networkCategory === 'slow' || deviceCategory === 'low';
  
  // Adaptive parameters
  let maxConcurrent: number;
  let windowSize: number;
  
  if (slow) {
    maxConcurrent = 2;
    windowSize = 3;
  } else if (fast) {
    maxConcurrent = 4;
    windowSize = 5;
  } else {
    maxConcurrent = 3;
    windowSize = 4;
  }
  
  // Additional constraints for save-data mode
  if (saveData) {
    maxConcurrent = Math.min(maxConcurrent, 2);
    windowSize = Math.min(windowSize, 3);
  }
  
  return {
    fast,
    slow,
    maxConcurrent,
    windowSize,
    deviceCategory,
    networkCategory
  };
}

/**
 * Get detailed performance metrics for debugging
 */
export function getDetailedPerfMetrics() {
  const navigatorWithConnection = navigator as typeof navigator & {
    connection?: ConnectionInfo;
    mozConnection?: ConnectionInfo;
    webkitConnection?: ConnectionInfo;
    deviceMemory?: number;
  };
  
  const connection = navigatorWithConnection.connection || 
                    navigatorWithConnection.mozConnection || 
                    navigatorWithConnection.webkitConnection;
  
  return {
    network: {
      downlink: connection?.downlink,
      effectiveType: connection?.effectiveType,
      rtt: connection?.rtt,
      saveData: connection?.saveData
    },
    device: {
      memory: navigatorWithConnection.deviceMemory,
      cores: navigator.hardwareConcurrency,
      userAgent: navigator.userAgent
    },
    timing: {
      navigationStart: performance.timing?.navigationStart,
      domContentLoaded: performance.timing?.domContentLoadedEventEnd && performance.timing?.navigationStart 
        ? performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart 
        : undefined,
      loadComplete: performance.timing?.loadEventEnd && performance.timing?.navigationStart
        ? performance.timing.loadEventEnd - performance.timing.navigationStart
        : undefined
    }
  };
}

/**
 * Monitor and log performance profile changes
 */
export function logPerformanceProfile() {
  const profile = getPerfProfile();
  const detailed = getDetailedPerfMetrics();
  
  console.log('🚀 Performance Profile:', {
    classification: { 
      fast: profile.fast, 
      slow: profile.slow,
      device: profile.deviceCategory,
      network: profile.networkCategory
    },
    settings: {
      maxConcurrent: profile.maxConcurrent,
      windowSize: profile.windowSize
    },
    metrics: detailed
  });
  
  return profile;
}