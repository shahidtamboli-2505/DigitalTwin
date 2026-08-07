import {
  FileText, Users, MapPin, Droplets, Building2, Activity,
  TrendingUp, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Legend,
} from "recharts";
import {
  DISTRICT_OVERVIEW, TEHSILS, FLOOD_HISTORY, INFRASTRUCTURE,
} from "../data/sangli-district";

const tooltipStyle = {
  backgroundColor: "var(--bg-secondary)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--text-primary)",
  fontSize: "12px",
};

export default function Reports() {
  const radarData = TEHSILS.map(t => ({
    name: t.name.split(" ")[0],
    risk: t.risk_score,
    literacy: t.literacy_rate,
    density: Math.round(t.population / t.area_sq_km),
  }));

  const floodDamages = FLOOD_HISTORY
    .filter(f => f.year >= 2000)
    .sort((a, b) => a.year - b.year)
    .map(f => ({ year: f.year.toString(), damages: f.damages_crore, affected: (f.affected_population / 1000) }));

  const infraByType = Object.entries(
    INFRASTRUCTURE.reduce((acc, i) => {
      const t = i.type.replace("_", " ");
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  return (
    <div className="dt-page">
      <div className="dt-page-header">
        <div>
          <h1 className="dt-page-title">District Reports</h1>
          <p className="dt-page-subtitle">Comprehensive analytics for Sangli District</p>
        </div>
      </div>

      {/* District Profile Card */}
      <div className="dt-card dt-report-profile">
        <div className="dt-card-header">
          <h3 className="dt-card-title">
            <FileText size={18} />
            District Profile — {DISTRICT_OVERVIEW.name}
          </h3>
        </div>
        <div className="dt-report-grid">
          <div className="dt-report-stat">
            <Users size={16} />
            <div>
              <span className="dt-report-stat-label">Total Population</span>
              <span className="dt-report-stat-value">{DISTRICT_OVERVIEW.population.toLocaleString()}</span>
            </div>
          </div>
          <div className="dt-report-stat">
            <MapPin size={16} />
            <div>
              <span className="dt-report-stat-label">Area</span>
              <span className="dt-report-stat-value">{DISTRICT_OVERVIEW.area_sq_km.toLocaleString()} km²</span>
            </div>
          </div>
          <div className="dt-report-stat">
            <Activity size={16} />
            <div>
              <span className="dt-report-stat-label">Literacy Rate</span>
              <span className="dt-report-stat-value">{DISTRICT_OVERVIEW.literacy_rate}%</span>
            </div>
          </div>
          <div className="dt-report-stat">
            <Users size={16} />
            <div>
              <span className="dt-report-stat-label">Sex Ratio</span>
              <span className="dt-report-stat-value">{DISTRICT_OVERVIEW.sex_ratio} / 1000</span>
            </div>
          </div>
          <div className="dt-report-stat">
            <Users size={16} />
            <div>
              <span className="dt-report-stat-label">Urban Pop.</span>
              <span className="dt-report-stat-value">{DISTRICT_OVERVIEW.population_urban.toLocaleString()}</span>
            </div>
          </div>
          <div className="dt-report-stat">
            <Users size={16} />
            <div>
              <span className="dt-report-stat-label">Rural Pop.</span>
              <span className="dt-report-stat-value">{DISTRICT_OVERVIEW.population_rural.toLocaleString()}</span>
            </div>
          </div>
          <div className="dt-report-stat">
            <TrendingUp size={16} />
            <div>
              <span className="dt-report-stat-label">Density</span>
              <span className="dt-report-stat-value">{DISTRICT_OVERVIEW.density_per_sq_km} /km²</span>
            </div>
          </div>
          <div className="dt-report-stat">
            <Droplets size={16} />
            <div>
              <span className="dt-report-stat-label">Major Rivers</span>
              <span className="dt-report-stat-value">{DISTRICT_OVERVIEW.rivers.join(", ")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dt-grid-2">
        {/* Tehsil Comparison Radar */}
        <div className="dt-card">
          <div className="dt-card-header">
            <h3 className="dt-card-title">
              <BarChart3 size={18} />
              Tehsil Comparison
            </h3>
          </div>
          <div className="dt-card-body" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <Radar name="Risk Score" dataKey="risk" stroke="#f87171" fill="#f87171" fillOpacity={0.2} />
                <Radar name="Literacy %" dataKey="literacy" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.15} />
                <Legend />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Flood Damage History */}
        <div className="dt-card">
          <div className="dt-card-header">
            <h3 className="dt-card-title">
              <Droplets size={18} />
              Flood Damage History (₹ Crore)
            </h3>
          </div>
          <div className="dt-card-body" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={floodDamages} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="year" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="damages" name="Damages (₹ Cr)" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dt-grid-2">
        {/* Infrastructure by Type */}
        <div className="dt-card">
          <div className="dt-card-header">
            <h3 className="dt-card-title">
              <Building2 size={18} />
              Infrastructure by Type
            </h3>
          </div>
          <div className="dt-card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={infraByType} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Count" fill="#60a5fa" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tehsil Data Table */}
        <div className="dt-card">
          <div className="dt-card-header">
            <h3 className="dt-card-title">Tehsil Data (Census 2011)</h3>
          </div>
          <div className="dt-card-body">
            <div className="dt-table-wrapper">
              <table className="dt-table dt-table-compact">
                <thead>
                  <tr>
                    <th>Tehsil</th>
                    <th>Population</th>
                    <th>Area (km²)</th>
                    <th>Literacy</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {TEHSILS.sort((a, b) => b.population - a.population).map(t => (
                    <tr key={t.id}>
                      <td className="dt-cell-name">{t.name}</td>
                      <td>{t.population.toLocaleString()}</td>
                      <td>{t.area_sq_km}</td>
                      <td>{t.literacy_rate}%</td>
                      <td>
                        <span style={{ color: t.risk_score >= 70 ? "#f87171" : t.risk_score >= 50 ? "#fbbf24" : "#34d399", fontWeight: 600 }}>
                          {t.risk_score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources Attribution */}
      <div className="dt-card dt-data-sources">
        <h4>Data Sources</h4>
        <ul>
          <li><strong>Census 2011</strong> — Directorate of Census Operations, Maharashtra</li>
          <li><strong>Flood Records</strong> — Maharashtra State Disaster Management Authority (MSDMA), SANDRP</li>
          <li><strong>Infrastructure Data</strong> — Sangli Zilla Parishad, NIC Sangli</li>
          <li><strong>Weather/Climate</strong> — India Meteorological Department (IMD)</li>
          <li><strong>River/Dam Data</strong> — WRD Maharashtra, Central Water Commission</li>
        </ul>
      </div>
    </div>
  );
}
