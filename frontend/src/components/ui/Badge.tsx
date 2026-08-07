interface BadgeProps {
  variant: "critical" | "high" | "medium" | "low" | "online" | "offline" | "warning" | "good" | "fair" | "poor";
  children: React.ReactNode;
  size?: "sm" | "md";
  dot?: boolean;
}

const VARIANT_CLASSES: Record<string, string> = {
  critical: "dt-badge-critical",
  high: "dt-badge-high",
  medium: "dt-badge-medium",
  low: "dt-badge-low",
  online: "dt-badge-online",
  offline: "dt-badge-offline",
  warning: "dt-badge-warning",
  good: "dt-badge-good",
  fair: "dt-badge-fair",
  poor: "dt-badge-poor",
};

export default function Badge({ variant, children, size = "sm", dot = false }: BadgeProps) {
  return (
    <span className={`dt-badge ${VARIANT_CLASSES[variant]} dt-badge-${size}`}>
      {dot && <span className="dt-badge-dot" />}
      {children}
    </span>
  );
}
