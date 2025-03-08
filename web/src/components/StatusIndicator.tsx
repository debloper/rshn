interface StatusIndicatorProps {
  isOn: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export default function StatusIndicator({ isOn, isLoading, onClick }: StatusIndicatorProps) {
  return (
    <div 
      className={`relative text-3xl cursor-pointer select-none transform transition-all duration-300 ${
        isLoading
          ? 'text-gray-400 animate-pulse'
          : isOn
          ? 'text-yellow-400 scale-110'
          : 'text-gray-600 filter saturate-0 scale-95'
      }`}
      style={{
        textShadow: isOn ? '0 0 10px rgba(255, 215, 0, 0.7)' : 'none',
      }}
      onClick={isLoading ? undefined : onClick}
      role="button"
      aria-label={isOn ? "Turn Off" : "Turn On"}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!isLoading) onClick();
        }
      }}
    >
      {/* Add visual glow effect for ON state */}
      {isOn && !isLoading && (
        <div
          className="absolute inset-0 rounded-full bg-yellow-400 opacity-20 blur-md -z-10 animate-pulse-slow"
          style={{ animation: 'pulse 2s infinite' }}
        ></div>
      )}
      ⚡
    </div>
  );
}
