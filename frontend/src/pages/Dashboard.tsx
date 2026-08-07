import { useNavigate } from "react-router-dom";
import {
  Users, AlertTriangle, Radio, Droplets, Thermometer,
  CloudRain, Wind, Clock, MapPin,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import {
  DISTRICT_OVERVIEW, TEHSILS, FLOOD_HISTORY, WEATHER_DATA,
  ALERTS, SUMMARY_STATS, SENSORS,
} from "../data/sangli-district";

const tooltipStyle = {
  backgroundColor: "var(--bg-secondary)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--text-primary)",
  fontSize: "12px",
};



function getRiskLabel(score: number): string {
  if (score >= 70) return "High";
  if (score >= 50) return "Medium";
  if (score >= 30) return "Low";
  return "Minimal";
}

export default function Dashboard() {
  const navigate = useNavigate();

  const populationData = TEHSILS
    .sort((a, b) => b.population - a.population)
    .map(t => ({ name: t.name.split(" ")[0], population: t.population, risk: t.risk_score }));

  const floodData = FLOOD_HISTORY
    .sort((a, b) => a.year - b.year)
    .filter(f => f.year >= 2000)
    .map(f => ({
      year: f.year,
      affected: f.affected_population / 1000,
      rainfall: f.rainfall_mm,
      damages: f.damages_crore,
    }));

  const riskDistribution = [
    { name: "Low (0-30)", value: TEHSILS.filter(t => t.risk_score < 30).length, color: "#34d399" },
    { name: "Medium (30-50)", value: TEHSILS.filter(t => t.risk_score >= 30 && t.risk_score < 50).length, color: "#60a5fa" },
    { name: "High (50-70)", value: TEHSILS.filter(t => t.risk_score >= 50 && t.risk_score < 70).length, color: "#fbbf24" },
    { name: "Critical (70+)", value: TEHSILS.filter(t => t.risk_score >= 70).length, color: "#f87171" },
  ].filter(d => d.value > 0);

  const waterLevelSensors = SENSORS.filter(s => s.type === "water_level");

  return (
    <div className="dt-page">
      {/* Page Header */}
      <div className="dt-page-header">
        <div>
          <h1 className="dt-page-title">Command Center</h1>
          <p className="dt-page-subtitle">
            Sangli District — Real-time Overview &middot; {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="dt-live-indicator">
          <span className="dt-live-dot" />
          LIVE
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dt-grid-4">
        <StatCard
          title="Population"
          value={(DISTRICT_OVERVIEW.population / 100000).toFixed(1) + " L"}
          subtitle="Census 2011"
          icon={<Users size={20} />}
          color="blue"
          trend={{ value: 8.2, label: "since 2001" }}
          onClick={() => navigate("/reports")}
        />
        <StatCard
          title="Risk Score"
          value={SUMMARY_STATS.avg_risk_score + "/100"}
          subtitle={getRiskLabel(SUMMARY_STATS.avg_risk_score) + " Risk"}
          icon={<AlertTriangle size={20} />}
          color="orange"
          trend={{ value: -3.5, label: "vs last month" }}
          onClick={() => navigate("/ai-predictions")}
        />
        <StatCard
          title="Active Sensors"
          value={`${SUMMARY_STATS.sensors_online}/${SUMMARY_STATS.total_sensors}`}
          subtitle={`${SUMMARY_STATS.sensors_warning} warning, ${SUMMARY_STATS.sensors_offline} offline`}
          icon={<Radio size={20} />}
          color="green"
          onClick={() => navigate("/sensors")}
        />
        <StatCard
          title="Active Alerts"
          value={SUMMARY_STATS.active_alerts}
          subtitle={`${SUMMARY_STATS.high_alerts} high priority`}
          icon={<AlertTriangle size={20} />}
          color="red"
          trend={{ value: 12, label: "this week" }}
          onClick={() => navigate("/alerts")}
        />
      </div>

      {/* Weather Strip */}
      <div className="dt-weather-strip">
        <div className="dt-weather-item">
          <Thermometer size={16} className="dt-weather-icon" />
          <div>
            <span className="dt-weather-value">32.4°C</span>
            <span className="dt-weather-label">Temperature</span>
          </div>
        </div>
        <div className="dt-weather-item">
          <CloudRain size={16} className="dt-weather-icon" />
          <div>
            <span className="dt-weather-value">12mm</span>
            <span className="dt-weather-label">Rainfall Today</span>
          </div>
        </div>
        <div className="dt-weather-item">
          <Droplets size={16} className="dt-weather-icon" />
          <div>
            <span className="dt-weather-value">72%</span>
            <span className="dt-weather-label">Humidity</span>
          </div>
        </div>
        <div className="dt-weather-item">
          <Wind size={16} className="dt-weather-icon" />
          <div>
            <span className="dt-weather-value">14 km/h</span>
            <span className="dt-weather-label">Wind Speed</span>
          </div>
        </div>
        <div className="dt-weather-item">
          <Droplets size={16} className="dt-weather-icon" />
          <div>
            <span className="dt-weather-value">12.4 m</span>
            <span className="dt-weather-label">Krishna Level</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="dt-grid-2">
        {/* Population by Tehsil */}
        <div className="dt-card">
          <div className="dt-card-header">
            <h3 className="dt-card-title">Population by Tehsil</h3>
            <span className="dt-card-badge">Census 2011</span>
          </div>
          <div className="dt-card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={populationData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickFormatter={(v: number) => (v / 1000).toFixed(0) + "K"} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value.toLocaleString(), "Population"]} />
                <Bar dataKey="population" radius={[4, 4, 0, 0]}>
                  {populationData.map((entry, i) => (
                    <Cell key={i} fill={entry.risk >= 70 ? "#f87171" : entry.risk >= 50 ? "#fbbf24" : "#60a5fa"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Weather */}
        <div className="dt-card">
          <div className="dt-card-header">
            <h3 className="dt-card-title">Climate Profile</h3>
            <span className="dt-card-badge">Monthly Avg</span>
          </div>
          <div className="dt-card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEATHER_DATA} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="avg_rainfall_mm" name="Rainfall (mm)" stroke="#60a5fa" fill="rgba(96, 165, 250, 0.15)" strokeWidth={2} />
                <Area type="monotone" dataKey="avg_temp_max" name="Max Temp (°C)" stroke="#f87171" fill="rgba(248, 113, 113, 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="dt-grid-3">
        {/* Flood History */}
        <div className="dt-card dt-span-2">
          <div className="dt-card-header">
            <h3 className="dt-card-title">Flood History (2005-2023)</h3>
            <span className="dt-card-badge">Disaster Records</span>
          </div>
          <div className="dt-card-body" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={floodData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="year" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="affected" name="Affected (K)" stroke="#f87171" strokeWidth={2} dot={{ fill: "#f87171", r: 4 }} />
                <Line type="monotone" dataKey="rainfall" name="Rainfall (mm)" stroke="#60a5fa" strokeWidth={2} dot={{ fill: "#60a5fa", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="dt-card">
          <div className="dt-card-header">
            <h3 className="dt-card-title">Risk Distribution</h3>
          </div>
          <div className="dt-card-body dt-flex-center" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value + " tehsils"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="dt-pie-legend">
              {riskDistribution.map((d, i) => (
                <div key={i} className="dt-pie-legend-item">
                  <span className="dt-pie-legend-dot" style={{ background: d.color }} />
                  <span>{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="dt-grid-2">
        {/* Water Level Sensors */}
        <div className="dt-card">
          <div className="dt-card-header">
            <h3 className="dt-card-title">Water Level Sensors</h3>
            <button className="dt-card-link" onClick={() => navigate("/sensors")}>
              View All →
            </button>
          </div>
          <div className="dt-card-body dt-sensor-list">
            {waterLevelSensors.map(sensor => {
              const pct = sensor.current_value / sensor.threshold_critical * 100;
              return (
                <div key={sensor.id} className="dt-sensor-row">
                  <div className="dt-sensor-info">
                    <MapPin size={14} />
                    <span className="dt-sensor-name">{sensor.name}</span>
                    <Badge variant={sensor.status} size="sm" dot>{sensor.status}</Badge>
                  </div>
                  <div className="dt-sensor-bar-wrapper">
                    <div className="dt-sensor-bar">
                      <div
                        className="dt-sensor-bar-fill"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: pct >= 85 ? "#f87171" : pct >= 65 ? "#fbbf24" : "#34d399",
                        }}
                      />
                    </div>
                    <span className="dt-sensor-val">{sensor.current_value} {sensor.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="dt-card">
          <div className="dt-card-header">
            <h3 className="dt-card-title">Recent Alerts</h3>
            <button className="dt-card-link" onClick={() => navigate("/alerts")}>
              View All →
            </button>
          </div>
          <div className="dt-card-body dt-alert-list">
            {ALERTS.slice(0, 5).map(alert => (
              <div key={alert.id} className="dt-alert-row">
                <div className="dt-alert-icon-wrap">
                  <AlertTriangle size={14} />
                </div>
                <div className="dt-alert-content">
                  <div className="dt-alert-row-header">
                    <span className="dt-alert-title">{alert.title}</span>
                    <Badge variant={alert.severity} size="sm">{alert.severity}</Badge>
                  </div>
                  <p className="dt-alert-desc">{alert.description.slice(0, 80)}...</p>
                  <div className="dt-alert-meta">
                    <Clock size={12} />
                    <span>{new Date(alert.timestamp).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    <MapPin size={12} />
                    <span>{alert.tehsil}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
