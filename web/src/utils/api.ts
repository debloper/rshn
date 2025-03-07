export interface DeviceStatus {
  status: 'ON' | 'OFF';
  channels: Record<string, number>;
}

export interface ChannelConfig {
  [key: string]: number;
}

// Helper function to add a timeout to fetch requests
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeout}ms`);
    }
    throw error;
  }
};

/**
 * Fetches the current device status which includes channel values
 */
export const fetchDeviceStatus = async (ipAddress: string): Promise<DeviceStatus> => {
  try {
    const response = await fetchWithTimeout(`http://${ipAddress}/`);

    if (!response.ok) {
      throw new Error(`Failed to fetch device status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`Could not connect to ${ipAddress}. Please check if the device is online.`);
    }
    throw error;
  }
};

/**
 * Toggles the device on/off
 */
export const toggleDevice = async (ipAddress: string): Promise<DeviceStatus> => {
  const response = await fetchWithTimeout(`http://${ipAddress}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle device: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Updates a single channel value
 */
export const updateChannel = async (
  ipAddress: string, 
  channel: string, 
  value: number
): Promise<{success: boolean}> => {
  const response = await fetchWithTimeout(`http://${ipAddress}/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ [channel]: value }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update channel: ${response.statusText}`);
  }

  return await response.json();
};
