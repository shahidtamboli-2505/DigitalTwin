import { useState } from "react";
import { Bell, AlertTriangle, Clock, MapPin, Users, Shield, CheckCircle, Filter } from "lucide-react";
import Badge from "../components/ui/Badge";
import StatCard from "../components/ui/StatCard";
import { ALERTS } from "../data/sangli-district";

type StatusFilter = "all" | "active" | "acknowledged" | "resolved";
type SeverityFilter = "all" | "critical" | "high" | "medium" | "low";

const CATEGORY_ICONS: Record<string, string> = {
  flood: "🌊", drought: "☀️", heat_wave: "🔥", infrastructure: "🏗️", environmental: "🌿",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444", high: "#f87171", medium: "#fbbf24", low: "#60a5fa",
};

export default function Alerts() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const filtered = ALERTS.filter(a => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchSeverity = severityFilter === "all" || a.severity === severityFilter;
    return matchStatus && matchSeverity;
  }).sort((a, b) => {
    const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const statusOrder = { active: 0, acknowledged: 1, resolved: 2 };
    return statusOrder[a.status] - statusOrder[b.status] || sevOrder[a.severity] - sevOrder[b.severity];
  });

  const active = ALERTS.filter(a => a.status === "active").length;
  const acknowledged = ALERTS.filter(a => a.status === "acknowledged").length;
  const resolved = ALERTS.filter(a => a.status === "resolved").length;
  const totalAffected = ALERTS.filter(a => a.status === "active").reduce((s, a) => s + a.affected_population, 0);

  return (
    <div className="dt-page">
      <div className="dt-page-header">
        <div>
          <h1 className="dt-page-title">Alert Management</h1>
          <p className="dt-page-subtitle">{ALERTS.length} total alerts • {active} active</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dt-grid-4">
        <StatCard title="Active Alerts" value={active} icon={<AlertTriangle size={20} />} color="red" />
        <StatCard title="Acknowledged" value={acknowledged} icon={<Shield size={20} />} color="orange" />
        <StatCard title="Resolved" value={resolved} icon={<CheckCircle size={20} />} color="green" />
        <StatCard title="Affected Population" value={(totalAffected / 1000).toFixed(0) + "K"} icon={<Users size={20} />} color="purple" />
      </div>

      {/* Filters */}
      <div className="dt-filter-row dt-mb">
        <div className="dt-filter-tabs">
          {(["all", "active", "acknowledged", "resolved"] as StatusFilter[]).map(status => (
            <button
              key={status}
              className={`dt-filter-tab ${statusFilter === status ? "active" : ""}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== "all" && (
                <span className="dt-filter-tab-count">
                  {ALERTS.filter(a => a.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="dt-filter-group">
          <Filter size={14} />
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value as SeverityFilter)}>
            <option value="all">All Severity</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🔵 Low</option>
          </select>
        </div>
      </div>

      {/* Alert List */}
      <div className="dt-alert-stack">
        {filtered.map(alert => (
          <div
            key={alert.id}
            className={`dt-alert-card ${alert.status} ${expandedAlert === alert.id ? "expanded" : ""}`}
            style={{ borderLeftColor: SEVERITY_COLORS[alert.severity] }}
            onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
          >
            <div className="dt-alert-card-header">
              <div className="dt-alert-card-left">
                <span className="dt-alert-category-icon">{CATEGORY_ICONS[alert.category]}</span>
                <div>
                  <h3 className="dt-alert-card-title">{alert.title}</h3>
                  <div className="dt-alert-card-meta">
                    <Clock size={12} />
                    <span>{new Date(alert.timestamp).toLocaleString("en-IN")}</span>
                    <MapPin size={12} />
                    <span>{alert.tehsil} Tehsil</span>
                  </div>
                </div>
              </div>
              <div className="dt-alert-card-right">
                <Badge variant={alert.severity}>{alert.severity}</Badge>
                <Badge variant={alert.status === "active" ? "critical" : alert.status === "acknowledged" ? "warning" : "good"} dot>
                  {alert.status}
                </Badge>
              </div>
            </div>

            {expandedAlert === alert.id && (
              <div className="dt-alert-card-body">
                <p className="dt-alert-card-description">{alert.description}</p>
                <div className="dt-alert-card-details">
                  <div className="dt-alert-detail">
                    <Users size={14} />
                    <span>Affected: <strong>{alert.affected_population.toLocaleString()}</strong> people</span>
                  </div>
                  <div className="dt-alert-detail">
                    <Shield size={14} />
                    <span>Response: <strong>{alert.response_team}</strong></span>
                  </div>
                  <div className="dt-alert-detail">
                    <Bell size={14} />
                    <span>Category: <strong>{alert.category.replace("_", " ")}</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="dt-empty">
            <Bell size={32} />
            <p>No alerts match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
