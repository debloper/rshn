interface StatusIndicatorProps {
  isOn: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export default function StatusIndicator({ isOn, isLoading, onClick }: StatusIndicatorProps) {
  return (
    <div 
      className={`text-3xl cursor-pointer transition-all duration-300 ${
        isLoading
          ? 'text-gray-400 animate-pulse'
          : isOn
          ? 'text-yellow-500'
          : 'text-gray-500'
      }`}
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
      ⚡
    </div>
  );
}
