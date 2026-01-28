
import React from 'react';
import { Civilization } from '../types';

interface Props {
  civ: Civilization;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const CivEmblem: React.FC<Props> = ({ civ, size = 'md' }) => {
  // Deterministic color generation based on Civ name string hash
  const getColors = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const c1 = `hsl(${Math.abs(hash) % 360}, 70%, 40%)`;
    const c2 = `hsl(${Math.abs(hash >> 2) % 360}, 60%, 25%)`;
    const iconColor = `hsl(${Math.abs(hash >> 4) % 360}, 80%, 80%)`;
    
    return { c1, c2, iconColor };
  };

  const { c1, c2, iconColor } = getColors(civ);
  
  // Pattern selection based on civ name length (pseudo-random)
  const patternType = civ.length % 3; 

  const pixelSize = size === 'sm' ? 24 : size === 'md' ? 48 : size === 'lg' ? 64 : 128;

  return (
    <div 
        className={`relative rounded-full shadow-lg border-2 border-yellow-700/50 overflow-hidden bg-stone-900 flex items-center justify-center`}
        style={{ width: pixelSize, height: pixelSize }}
    >
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        <defs>
            <linearGradient id={`grad-${civ}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={c1} />
                <stop offset="100%" stopColor={c2} />
            </linearGradient>
        </defs>
        
        {/* Background Base */}
        <circle cx="50" cy="50" r="50" fill={`url(#grad-${civ})`} />

        {/* Heraldic Patterns */}
        {patternType === 0 && (
            // Vertical Split
            <rect x="50" y="0" width="50" height="100" fill="rgba(0,0,0,0.3)" />
        )}
        {patternType === 1 && (
            // Diagonal
            <path d="M0 0 L100 100 L0 100 Z" fill="rgba(0,0,0,0.3)" />
        )}
        {patternType === 2 && (
            // Cross
            <path d="M40 0 H60 V100 H40 Z M0 40 V60 H100 V40 Z" fill="rgba(0,0,0,0.3)" />
        )}
        
        {/* Icon Placeholder (First Letter) */}
        <text 
            x="50" 
            y="65" 
            fontSize="45" 
            fontFamily="serif" 
            fontWeight="bold" 
            fill={iconColor} 
            textAnchor="middle"
            filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.5))"
        >
            {civ.charAt(0)}
        </text>
        
        {/* Border shine */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="url(#shine)" strokeWidth="2" opacity="0.5" />
      </svg>
    </div>
  );
};

export default CivEmblem;
