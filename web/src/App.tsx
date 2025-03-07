import { useState, useEffect, useCallback } from 'react';
import ColorChannel from './components/ColorChannel';
import StatusIndicator from './components/StatusIndicator';
import IPAddressInput from './components/IPAddressInput';
import Footer from './components/Footer';
import { fetchDeviceStatus, toggleDevice } from './utils/api';

// Default IP address
const DEFAULT_IP = '192.168.1.42';

function App() {
  const [ipAddress, setIpAddress] = useState(() => {
    // Try to get IP from local storage, or use default
    return localStorage.getItem('rshnIpAddress') || DEFAULT_IP;
  });
  const [isOn, setIsOn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  // Centralize channel values in App component
  const [channels, setChannels] = useState<Record<string, number>>({
    red: 0,
    green: 0,
    blue: 0,
    cold: 0,
    warm: 0
  });

  // Fetch device status and channel information
  const fetchDeviceData = useCallback(async () => {
    if (!ipAddress) return;

    setIsLoading(true);
    setError('');
    setConnectionStatus('connecting');

    try {
      const data = await fetchDeviceStatus(ipAddress);
      setIsOn(data.status === 'ON');

      // Update channel values from the device status response
      if (data.channels) {
        setChannels(prevChannels => ({
          ...prevChannels,
          ...data.channels
        }));
      }

      // Save IP to local storage if successful
      localStorage.setItem('rshnIpAddress', ipAddress);
      setConnectionStatus('connected');
    } catch (err) {
      console.error('Error fetching device status:', err);
      // Set specific error for connection issues
      if (err instanceof Error && (
          err.message.includes('NetworkError') || 
          err.message.includes('Failed to fetch') ||
          err.message.includes('connect')
      )) {
        setError(`Could not connect to device at ${ipAddress}. Please check the IP address and ensure the device is online.`);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to connect to device');
      }
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  }, [ipAddress]);

  // Initial fetch on mount and when IP changes
  useEffect(() => {
    fetchDeviceData();
  }, [fetchDeviceData]);

  const handleToggle = async () => {
    if (isLoading || connectionStatus !== 'connected') return;

    setIsLoading(true);
    setError('');

    try {
      const data = await toggleDevice(ipAddress);
      setIsOn(data.status === 'ON');

      // Update channel values from the response
      if (data.channels) {
        setChannels(prevChannels => ({
          ...prevChannels,
          ...data.channels
        }));
      }
    } catch (err) {
      console.error('Error toggling device:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle device');
      // Check if we've lost connection
      if (err instanceof Error && 
          (err.message.includes('NetworkError') || 
           err.message.includes('Failed to fetch'))) {
        setConnectionStatus('disconnected');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle IP address updates
  const handleIpChange = (newIp: string) => {
    if (newIp !== ipAddress) {
      setIpAddress(newIp);
      // No need to call fetchDeviceData here as it will be triggered by the useEffect
    }
  };

  // Handle retry connection
  const handleRetry = () => {
    fetchDeviceData();
  };

  // Handle channel value changes
  const handleChannelValueChange = (channel: string, value: number) => {
    setChannels(prev => ({
      ...prev,
      [channel]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 
                    text-white flex flex-col items-center justify-center p-6 touch-manipulation">
      <div className="text-4xl font-bold mb-8 flex items-center gap-3">
        <span>RSHN</span>
        <StatusIndicator isOn={isOn} isLoading={isLoading} onClick={handleToggle} />
        <span>CTRL</span>
      </div>

      <IPAddressInput value={ipAddress} onChange={handleIpChange} />

      {/* Connection Status Indicator */}
      {connectionStatus === 'connecting' && (
        <div className="text-blue-400 mb-6 bg-blue-900/30 rounded-lg p-3 border border-blue-500 max-w-sm w-full text-center flex items-center justify-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-300 rounded-full border-t-transparent"></div>
          Connecting to device...
        </div>
      )}

      {/* Error Display with Retry Button */}
      {error && connectionStatus === 'disconnected' && (
        <div className="text-red-400 mb-6 bg-red-900/30 rounded-lg p-4 border border-red-500 max-w-sm w-full">
          <p className="text-center mb-3">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded w-full 
                      transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry Connection
          </button>
        </div>
      )}

      <div className="rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm w-full max-w-md space-y-4 shadow-xl border border-slate-800">
        <ColorChannel 
          name="red" 
          label="Red" 
          serverAddress={ipAddress} 
          value={channels.red || 0}
          onValueChange={handleChannelValueChange} 
        />
        <ColorChannel 
          name="green" 
          label="Green" 
          serverAddress={ipAddress} 
          value={channels.green || 0}
          onValueChange={handleChannelValueChange} 
        />
        <ColorChannel 
          name="blue" 
          label="Blue" 
          serverAddress={ipAddress} 
          value={channels.blue || 0} 
          onValueChange={handleChannelValueChange}
        />
        <ColorChannel 
          name="cold" 
          label="Cold White" 
          serverAddress={ipAddress} 
          value={channels.cold || 0}
          onValueChange={handleChannelValueChange} 
        />
        <ColorChannel 
          name="warm" 
          label="Warm White" 
          serverAddress={ipAddress} 
          value={channels.warm || 0}
          onValueChange={handleChannelValueChange} 
        />
      </div>

      {/* Replace simple footer text with the new Footer component */}
      <Footer />
    </div>
  );
}

export default App;
