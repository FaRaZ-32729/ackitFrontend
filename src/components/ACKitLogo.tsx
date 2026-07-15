import React from 'react';

interface ACKitLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ACKitLogo({ className = '', variant = 'full', size = 'md' }: ACKitLogoProps) {
  // Dimensions map based on size
  const dimensions = {
    sm: variant === 'icon' ? 'w-8 h-8' : 'h-8',
    md: variant === 'icon' ? 'w-12 h-12' : 'h-11',
    lg: variant === 'icon' ? 'w-16 h-16' : 'h-16',
    xl: variant === 'icon' ? 'w-24 h-24' : 'h-24',
  };

  const containerClass = `${dimensions[size]} flex items-center select-none ${className}`;

  if (variant === 'text') {
    return (
      <div className={containerClass}>
        <svg viewBox="0 0 150 50" className="h-full w-auto">
          {/* Outlined AC KIT text */}
          <text
            x="5"
            y="38"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="32"
            fontWeight="900"
            fill="#0284c7"
            stroke="#172554"
            strokeWidth="3.5"
            strokeLinejoin="round"
            paintOrder="stroke fill"
            letterSpacing="2"
          >
            AC KIT
          </text>
        </svg>
      </div>
    );
  }

  // Pure Vector SVG of the Logo (Cloud, AC Unit, Snowflake, Breeze Dots, Wireless Waves + AC KIT text)
  return (
    <div className={containerClass}>
      <svg 
        viewBox={variant === 'icon' ? '0 0 160 140' : '0 0 380 140'} 
        className="h-full w-auto"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ICON CONTAINER */}
        <g id="logo-icon" transform="translate(10, 5)">
          {/* Wireless Waves (Top Right) */}
          <g id="wireless-waves">
            <path 
              d="M105,45 C115,25 130,22 142,32" 
              stroke="#60a5fa" 
              strokeWidth="5" 
              strokeLinecap="round" 
              fill="none" 
            />
            <path 
              d="M102,28 C118,8 138,5 152,18" 
              stroke="#3b82f6" 
              strokeWidth="6" 
              strokeLinecap="round" 
              fill="none" 
            />
            <path 
              d="M99,11 C121,-10 148,-10 162,5" 
              stroke="#1d4ed8" 
              strokeWidth="7" 
              strokeLinecap="round" 
              fill="none" 
            />
          </g>

          {/* Left Circuit-style C-Cloud Contour (Sky Blue) */}
          <path 
            d="M50,110 C20,110 5,95 5,75 C5,55 20,40 45,40 C52,40 58,42 62,45" 
            stroke="#38bdf8" 
            strokeWidth="7.5" 
            strokeLinecap="round" 
            fill="none" 
          />
          {/* Decorative circuit node lines inside the left C-Cloud segment */}
          <path d="M12,70 L25,70" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M18,62 L18,78" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="25" cy="70" r="2.5" fill="#38bdf8" />
          <path d="M15,85 L30,85" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" />

          {/* Top Main Cloud Arch (Deep Blue) */}
          <path 
            d="M40,40 C40,20 62,5 85,5 C108,5 125,22 125,45 C125,48 124,52 123,55" 
            stroke="#0284c7" 
            strokeWidth="9" 
            strokeLinecap="round" 
            fill="none" 
          />

          {/* AC Unit Body (Blue rounded rectangle) */}
          <g id="ac-unit-body" transform="translate(38, 55)">
            <rect 
              x="0" 
              y="0" 
              width="85" 
              height="38" 
              rx="9" 
              fill="#0284c7" 
              stroke="#1e3a8a" 
              strokeWidth="2.5" 
            />
            {/* Horizontal vents slit */}
            <rect x="6" y="27" width="73" height="4" rx="2" fill="#1e3a8a" />
            
            {/* White Snowflake Icon on AC Unit */}
            <g id="snowflake-dec" transform="translate(63, 14)">
              <line x1="0" y1="-6" x2="0" y2="6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              <line x1="-6" y1="0" x2="6" y2="0" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              <line x1="-4" y1="-4" x2="4" y2="4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="4" y1="-4" x2="-4" y2="4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </g>

          {/* Cooling Breeze Drops / Airflow (Blowing down) */}
          <g id="cooling-breeze" transform="translate(56, 102)" fill="#0284c7">
            {/* Droplets Row 1 */}
            <circle cx="0" cy="0" r="3" />
            <circle cx="16" cy="0" r="3" />
            <circle cx="32" cy="0" r="3" />
            <circle cx="48" cy="0" r="3" />
            
            {/* Droplets Row 2 */}
            <circle cx="8" cy="12" r="3" />
            <circle cx="24" cy="12" r="3" />
            <circle cx="40" cy="12" r="3" />
            
            {/* Droplets Row 3 */}
            <circle cx="16" cy="24" r="3" />
            <circle cx="32" cy="24" r="3" />
          </g>
        </g>

        {/* TEXT CONTAINER (Omitted if variant is icon) */}
        {variant === 'full' && (
          <g id="logo-text" transform="translate(180, 85)">
            {/* Premium roundedoutlined "AC KIT" text */}
            <text
              x="0"
              y="0"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="68"
              fontWeight="900"
              fill="#0284c7"
              stroke="#172554"
              strokeWidth="6.5"
              strokeLinejoin="round"
              paintOrder="stroke fill"
              letterSpacing="3"
            >
              AC KIT
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
