interface GaugeChartProps {
  value: number; // 0 to 1
  label: string;
  size?: number;
  color?: string;
  bgColor?: string;
}

export default function GaugeChart({ value, label, size = 120, color, bgColor }: GaugeChartProps) {
  const clampedValue = Math.max(0, Math.min(1, value));
  const radius = (size - 16) / 2;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference * (1 - clampedValue);

  const getColor = () => {
    if (color) return color;
    if (clampedValue >= 0.75) return "#f87171";
    if (clampedValue >= 0.5) return "#fbbf24";
    if (clampedValue >= 0.25) return "#60a5fa";
    return "#34d399";
  };

  return (
    <div className="dt-gauge" style={{ width: size, height: size * 0.7 }}>
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Background arc */}
        <path
          d={`M 8,${size * 0.6} A ${radius},${radius} 0 0 1 ${size - 8},${size * 0.6}`}
          fill="none"
          stroke={bgColor || "rgba(148, 163, 184, 0.15)"}
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M 8,${size * 0.6} A ${radius},${radius} 0 0 1 ${size - 8},${size * 0.6}`}
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        {/* Value text */}
        <text
          x={size / 2}
          y={size * 0.45}
          textAnchor="middle"
          className="dt-gauge-value"
          fill="var(--text-primary)"
          fontSize={size * 0.18}
          fontWeight="700"
        >
          {Math.round(clampedValue * 100)}%
        </text>
        <text
          x={size / 2}
          y={size * 0.6}
          textAnchor="middle"
          className="dt-gauge-label"
          fill="var(--text-muted)"
          fontSize={size * 0.09}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
