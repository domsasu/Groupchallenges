import React, { useEffect, useState } from 'react';

interface RollingCounterProps {
  value: number;
  startFromZero?: boolean;
  className?: string;
  delay?: number;
}

export const RollingCounter: React.FC<RollingCounterProps> = ({ 
  value, 
  startFromZero = false,
  className = '',
  delay = 0
}) => {
  // Initialize state. If startFromZero is true, we start at 0, otherwise at the passed value.
  const [targetValue, setTargetValue] = useState(() => startFromZero ? 0 : value);

  useEffect(() => {
    if (startFromZero) {
      // Always animate to the target value if it differs from current targetValue
      // This ensures animation runs even after StrictMode double-mount
      const timer = setTimeout(() => {
        setTargetValue(value);
      }, delay);
      
      return () => clearTimeout(timer);
    } else {
      // If not strictly starting from zero on mount, we just sync with props.
      setTargetValue(value);
    }
  }, [value, startFromZero, delay]);

  const digits = targetValue.toString().split('');

  return (
    <div className={`inline-flex relative overflow-hidden tabular-nums leading-none ${className}`} style={{ height: '1em' }}>
      {digits.map((digit, index) => (
        <Digit key={index} digit={digit} delay={index * 30} />
      ))}
    </div>
  );
};

const Digit: React.FC<{ digit: string; delay: number }> = ({ digit, delay }) => {
  const isNumber = !isNaN(parseInt(digit));
  
  // If it's not a number (e.g. "."), just render it static.
  if (!isNumber) return <span className="inline-block">{digit}</span>;

  return (
    <div className="relative inline-block h-[1em]">
      {/* Ghost element to define width (8 is typically widest) */}
      <span className="opacity-0 invisible">8</span>
      
      {/* The Number Strip */}
      <div
        className="absolute left-0 top-0 flex flex-col w-full transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ 
            transform: `translateY(-${parseInt(digit) * 10}%)`,
            transitionDelay: `${delay}ms`
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <div key={num} className="h-[1em] w-fit flex items-center justify-center">
            {num}
          </div>
        ))}
      </div>
    </div>
  );
};