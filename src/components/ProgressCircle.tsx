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
      <svg className="progress-ring" viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        <circle
          className="progress-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          className="progress-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gradient">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}