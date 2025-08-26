'use client';

interface ProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressCircle({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  className = ""
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg 
        className="progress-ring" 
        viewBox={`0 0 ${size} ${size}`} 
        style={{ width: size, height: size }}
      >
        <circle
          className="progress-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke="rgba(203, 213, 225, 0.3)"
        />
        <circle
          className="progress-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          stroke="url(#gradient)"
          strokeLinecap="round"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(14, 165, 233, 0.2))'
          }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-blue-600 bg-clip-text text-transparent">
            {Math.round(progress)}%
          </span>
          <div className="text-xs text-gray-500 mt-1">Completado</div>
        </div>
      </div>
    </div>
  );
}