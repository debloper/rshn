import React, { useState, useEffect } from 'react';

interface IPAddressInputProps {
  value: string;
  onChange: (newIp: string) => void;
}

const IPAddressInput: React.FC<IPAddressInputProps> = ({ value, onChange }) => {
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  // Update local value when the prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    onChange(localValue);
  };

  // Basic IP address validation
  const isValidIP = (ip: string): boolean => {
    // Simple regex pattern for validating IP addresses
    const pattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    return pattern.test(ip);
  };

  return (
    <div className="mb-6 w-full max-w-sm">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-800/90 border border-slate-600/50 rounded-l-md
                      focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500
                      text-white shadow-inner"
            placeholder="Device IP Address"
            autoFocus
          />
          <button
            type="submit"
            className={`px-3 py-2 rounded-r-md font-medium ${
              isValidIP(localValue)
                ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                : 'bg-gray-600 cursor-not-allowed text-gray-300'
            } transition-colors duration-200 shadow`}
            disabled={!isValidIP(localValue)}
          >
            Connect
          </button>
        </form>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="flex items-center justify-center space-x-2 bg-slate-800/80 backdrop-blur-sm px-3 py-2
                    rounded-md border border-slate-700/50 cursor-pointer hover:bg-slate-700/80
                    transition-colors duration-200 text-slate-200 shadow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span>{localValue}</span>
        </div>
      )}
    </div>
  );
};

export default IPAddressInput;
