import { useState, useEffect } from "react";
import { Radio, Wifi, WifiOff, AlertTriangle, MapPin } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import Badge from "../components/ui/Badge";
import StatCard from "../components/ui/StatCard";
import { SENSORS, getUpdatedSensorValue, type SensorReading } from "../data/sangli-district";

const SENSOR_TYPE_LABELS: Record<string, string> = {
  water_level: "💧 Water Level",
  weather: "🌡️ Weather",
  traffic: "🚗 Traffic",
  air_quality: "🌫️ Air Quality",
  seismic: "📊 Seismic",
};

const SENSOR_TYPE_COLORS: Record<string, string> = {
  water_level: "#38bdf8",
  weather: "#f87171",
  traffic: "#fbbf24",
  air_quality: "#a78bfa",
  seismic: "#34d399",
};

export default function Sensors() {
  const [sensors, setSensors] = useState<SensorReading[]>(SENSORS);
  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prev => prev.map(sensor => {
        if (sensor.status === "offline") return sensor;
        const newValue = getUpdatedSensorValue(sensor);
        const newHistory = [...sensor.history.slice(1), newValue];
        let newStatus = sensor.status;
        if (newValue >= sensor.threshold_critical) newStatus = "warning";
        else if (newValue >= sensor.threshold_warning) newStatus = "warning";
        else newStatus = "online";
        return { ...sensor, current_value: newValue, history: newHistory, status: newStatus };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const filtered = sensors.filter(s => {
    const matchType = filter === "all" || s.type === filter;
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchType && matchStatus;
  });

  const online = sensors.filter(s => s.status === "online").length;
  const warning = sensors.filter(s => s.status === "warning").length;
  const offline = sensors.filter(s => s.status === "offline").length;

  const getStatusColor = (sensor: SensorReading) => {
    const pct = sensor.current_value / sensor.threshold_critical;
    if (pct >= 0.85) return "#f87171";
    if (pct >= 0.65) return "#fbbf24";
    return "#34d399";
  };

  return (
    <div className="dt-page">
      <div className="dt-page-header">
        <div>
          <h1 className="dt-page-title">Live Sensor Monitoring</h1>
          <p className="dt-page-subtitle">
            {sensors.length} sensors across Sangli District • Auto-refreshing every 2s
          </p>
        </div>
        <div className="dt-live-indicator">
          <span className="dt-live-dot" />
          LIVE
        </div>
      </div>

      {/* KPI */}
      <div className="dt-grid-4">
        <StatCard title="Total Sensors" value={sensors.length} icon={<Radio size={20} />} color="blue" />
        <StatCard title="Online" value={online} icon={<Wifi size={20} />} color="green" />
        <StatCard title="Warning" value={warning} icon={<AlertTriangle size={20} />} color="orange" />
        <StatCard title="Offline" value={offline} icon={<WifiOff size={20} />} color="red" />
      </div>

      {/* Filters */}
      <div className="dt-filter-row dt-mb">
        <div className="dt-filter-group">
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="water_level">💧 Water Level</option>
            <option value="weather">🌡️ Weather</option>
            <option value="traffic">🚗 Traffic</option>
            <option value="air_quality">🌫️ Air Quality</option>
            <option value="seismic">📊 Seismic</option>
          </select>
        </div>
        <div className="dt-filter-group">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="warning">Warning</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Sensor Grid */}
      <div className="dt-grid-3">
        {filtered.map(sensor => {
          const sparkData = sensor.history.map((v, i) => ({ i, v }));
          const pct = (sensor.current_value / sensor.threshold_critical * 100).toFixed(0);
          return (
            <div key={sensor.id} className={`dt-card dt-sensor-card ${sensor.status === "warning" ? "dt-sensor-warning" : sensor.status === "offline" ? "dt-sensor-offline" : ""}`}>
              <div className="dt-sensor-card-header">
                <div>
                  <span className="dt-sensor-type">{SENSOR_TYPE_LABELS[sensor.type]}</span>
                  <h4 className="dt-sensor-card-name">{sensor.name}</h4>
                </div>
                <Badge variant={sensor.status as "online" | "offline" | "warning"} dot>{sensor.status}</Badge>
              </div>

              <div className="dt-sensor-value-row">
                <span className="dt-sensor-big-value" style={{ color: getStatusColor(sensor) }}>
                  {sensor.current_value}
                </span>
                <span className="dt-sensor-unit">{sensor.unit}</span>
              </div>

              {/* Sparkline */}
              <div className="dt-sparkline">
                <ResponsiveContainer width="100%" height={50}>
                  <LineChart data={sparkData}>
                    <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={SENSOR_TYPE_COLORS[sensor.type]}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Threshold Bar */}
              <div className="dt-threshold-section">
                <div className="dt-threshold-labels">
                  <span>0</span>
                  <span className="dt-threshold-warn">⚠ {sensor.threshold_warning}</span>
                  <span className="dt-threshold-crit">🚨 {sensor.threshold_critical}</span>
                </div>
                <div className="dt-threshold-bar">
                  <div className="dt-threshold-bar-fill" style={{ width: `${Math.min(Number(pct), 100)}%`, background: getStatusColor(sensor) }} />
                  <div className="dt-threshold-marker warn" style={{ left: `${(sensor.threshold_warning / sensor.threshold_critical * 100)}%` }} />
                </div>
              </div>

              <div className="dt-sensor-card-footer">
                <MapPin size={12} />
                <span>{sensor.tehsil}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
