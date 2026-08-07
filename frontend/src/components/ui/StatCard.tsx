import { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color?: "blue" | "green" | "orange" | "red" | "purple" | "cyan";
  onClick?: () => void;
}

const COLOR_MAP = {
  blue: { bg: "rgba(96, 165, 250, 0.1)", border: "rgba(96, 165, 250, 0.3)", text: "#60a5fa" },
  green: { bg: "rgba(52, 211, 153, 0.1)", border: "rgba(52, 211, 153, 0.3)", text: "#34d399" },
  orange: { bg: "rgba(251, 191, 36, 0.1)", border: "rgba(251, 191, 36, 0.3)", text: "#fbbf24" },
  red: { bg: "rgba(248, 113, 113, 0.1)", border: "rgba(248, 113, 113, 0.3)", text: "#f87171" },
  purple: { bg: "rgba(167, 139, 250, 0.1)", border: "rgba(167, 139, 250, 0.3)", text: "#a78bfa" },
  cyan: { bg: "rgba(34, 211, 238, 0.1)", border: "rgba(34, 211, 238, 0.3)", text: "#22d3ee" },
};

export default function StatCard({ title, value, subtitle, icon, trend, color = "blue", onClick }: StatCardProps) {
  const colors = COLOR_MAP[color];
  const TrendIcon = trend ? (trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus) : null;

  return (
    <div
      className="dt-stat-card"
      onClick={onClick}
      style={{
        borderColor: colors.border,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div className="dt-stat-header">
        <span className="dt-stat-title">{title}</span>
        <div className="dt-stat-icon" style={{ background: colors.bg, color: colors.text }}>
          {icon}
        </div>
      </div>
      <div className="dt-stat-value">{value}</div>
      <div className="dt-stat-footer">
        {subtitle && <span className="dt-stat-subtitle">{subtitle}</span>}
        {trend && TrendIcon && (
          <span className={`dt-stat-trend ${trend.value > 0 ? "up" : trend.value < 0 ? "down" : "neutral"}`}>
            <TrendIcon size={14} />
            {Math.abs(trend.value)}% {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}
