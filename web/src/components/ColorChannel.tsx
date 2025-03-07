import { useState, useEffect } from 'react';
import { updateChannel } from '../utils/api';

interface ColorChannelProps {
  name: string;
  label: string;
  serverAddress: string;
  value: number;
  onValueChange: (name: string, value: number) => void;
}

function ColorChannel({ name, label, serverAddress, value, onValueChange }: ColorChannelProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle slider change - just update local state
  const handleChange = (newValue: number) => {
    setLocalValue(newValue);
  };

  // Send the update only when the user releases the slider
  const handleRelease = async () => {
    // Don't send an update if the value hasn't changed
    if (localValue === value) return;

    setIsLoading(true);
    setError('');

    try {
      await updateChannel(serverAddress, name, localValue);
      onValueChange(name, localValue);
    } catch (err) {
      console.error(`Error updating ${name} channel:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Revert to previous value if there was an error
      setLocalValue(value);
    } finally {
      setIsLoading(false);
    }
  };

  const getBgColor = () => {
    switch (name) {
      case 'red': return `rgba(255, 0, 0, ${localValue / 255})`;
      case 'green': return `rgba(0, 255, 0, ${localValue / 255})`;
      case 'blue': return `rgba(0, 0, 255, ${localValue / 255})`;
      case 'cold': return `rgba(200, 200, 255, ${localValue / 255})`;
      case 'warm': return `rgba(255, 200, 120, ${localValue / 255})`;
      default: return 'transparent';
    }
  };

  const getBackgroundStyle = () => {
    // Base style with gradient
    let gradient;
    switch (name) {
      case 'red': 
        gradient = `linear-gradient(to right, rgba(0, 0, 0, 0.2), rgba(255, 0, 0, ${0.1 + (localValue / 255) * 0.3}))`;
        break;
      case 'green':
        gradient = `linear-gradient(to right, rgba(0, 0, 0, 0.2), rgba(0, 255, 0, ${0.1 + (localValue / 255) * 0.3}))`;
        break;
      case 'blue':
        gradient = `linear-gradient(to right, rgba(0, 0, 0, 0.2), rgba(0, 0, 255, ${0.1 + (localValue / 255) * 0.3}))`;
        break;
      case 'cold':
        gradient = `linear-gradient(to right, rgba(0, 0, 0, 0.2), rgba(200, 200, 255, ${0.1 + (localValue / 255) * 0.3}))`;
        break;
      case 'warm':
        gradient = `linear-gradient(to right, rgba(0, 0, 0, 0.2), rgba(255, 200, 120, ${0.1 + (localValue / 255) * 0.3}))`;
        break;
      default:
        gradient = 'none';
    }

    return {
      background: gradient,
      boxShadow: localValue > 100 ? `0 0 10px ${getBgColor()}` : 'none',
      transition: 'background 0.3s, box-shadow 0.3s',
    };
  };

  return (
    <div 
      className="bg-slate-800 p-5 rounded-lg shadow-lg border border-slate-700 overflow-hidden relative"
      style={getBackgroundStyle()}
    >
      <div className="flex justify-between mb-3 items-center">
        <label htmlFor={`slider-${name}`} className="font-medium text-lg">
          {label}
        </label>
        <span className="text-slate-300 font-mono bg-slate-900/50 px-2 py-1 rounded-md min-w-[3rem] text-center">
          {localValue}
        </span>
      </div>
      <div className="relative">
        <div
          className="absolute top-0 left-0 bottom-0 rounded-md transition-all duration-200"
          style={{
            width: `${(localValue / 255) * 100}%`,
            backgroundColor: getBgColor(),
            opacity: 0.3,
          }}
        />
        <input
          id={`slider-${name}`}
          type="range"
          min="0"
          max="255"
          value={localValue}
          disabled={isLoading}
          onChange={(e) => handleChange(Number(e.target.value))}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          onKeyUp={(e) => e.key === 'Enter' && handleRelease()}
          className={`w-full h-6 bg-slate-700 rounded-lg appearance-none cursor-pointer relative z-10 
                      ${isLoading ? 'opacity-50' : 'opacity-100'}`}
        />
      </div>
      {error && <div className="mt-2 text-red-400 text-sm">{error}</div>}
    </div>
  );
}

export default ColorChannel;
