import { useState, useEffect } from 'react';

interface IPAddressInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function IPAddressInput({ value, onChange }: IPAddressInputProps) {
  const [inputValue, setInputValue] = useState(value);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(inputValue);
  };

  const handleBlur = () => {
    if (inputValue !== value) {
      onChange(inputValue);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto mb-8">
      <div className="relative">
        <input
          type="text"
          placeholder="LED Module IP Address"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full p-3 pl-4 text-lg font-medium rounded-full text-black 
                     dark:text-white bg-white/90 dark:bg-gray-800/90 
                     focus:ring-2 focus:ring-yellow-500 
                     border-2 border-gray-300 dark:border-gray-700
                     outline-none shadow-md transition-all duration-200 
                     hover:shadow-lg focus:shadow-lg text-center"
          aria-label="LED Module IP Address"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-500 rounded-full blur-sm opacity-20"></div>
      </div>
    </form>
  );
}
