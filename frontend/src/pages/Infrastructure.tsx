import { useState } from "react";
import { Building2, Search, Filter, ArrowUpDown, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Badge from "../components/ui/Badge";
import StatCard from "../components/ui/StatCard";
import { INFRASTRUCTURE, SUMMARY_STATS } from "../data/sangli-district";

type SortField = "name" | "risk_score" | "condition" | "year_built";
type SortDir = "asc" | "desc";

const TYPE_ICONS: Record<string, string> = {
  dam: "🏗️", bridge: "🌉", hospital: "🏥", school: "🏫",
  power_station: "⚡", water_treatment: "💧", road: "🛣️",
};

const CONDITION_ORDER: Record<string, number> = { critical: 0, poor: 1, fair: 2, good: 3 };

export default function Infrastructure() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("risk_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const types = [...new Set(INFRASTRUCTURE.map(i => i.type))];

  const filtered = INFRASTRUCTURE
    .filter(i => {
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.tehsil.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || i.type === typeFilter;
      const matchCondition = conditionFilter === "all" || i.condition === conditionFilter;
      return matchSearch && matchType && matchCondition;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "risk_score": cmp = a.risk_score - b.risk_score; break;
        case "condition": cmp = (CONDITION_ORDER[a.condition] || 0) - (CONDITION_ORDER[b.condition] || 0); break;
        case "year_built": cmp = a.year_built - b.year_built; break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const conditionBadgeVariant = (c: string) => {
    switch (c) {
      case "good": return "good" as const;
      case "fair": return "fair" as const;
      case "poor": return "poor" as const;
      case "critical": return "critical" as const;
      default: return "low" as const;
    }
  };

  return (
    <div className="dt-page">
      <div className="dt-page-header">
        <div>
          <h1 className="dt-page-title">Infrastructure Registry</h1>
          <p className="dt-page-subtitle">
            {INFRASTRUCTURE.length} monitored assets across Sangli District
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dt-grid-4">
        <StatCard
          title="Total Assets"
          value={SUMMARY_STATS.infrastructure_count}
          icon={<Building2 size={20} />}
          color="blue"
        />
        <StatCard
          title="Good Condition"
          value={INFRASTRUCTURE.filter(i => i.condition === "good").length}
          icon={<CheckCircle size={20} />}
          color="green"
        />
        <StatCard
          title="Needs Attention"
          value={INFRASTRUCTURE.filter(i => i.condition === "fair").length}
          subtitle="Fair condition"
          icon={<Clock size={20} />}
          color="orange"
        />
        <StatCard
          title="Critical / Poor"
          value={SUMMARY_STATS.infrastructure_poor + SUMMARY_STATS.infrastructure_critical}
          subtitle="Immediate action required"
          icon={<AlertTriangle size={20} />}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="dt-card">
        <div className="dt-filter-row">
          <div className="dt-search-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name or tehsil..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="dt-filter-group">
            <Filter size={14} />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              {types.map(t => (
                <option key={t} value={t}>{TYPE_ICONS[t] || ""} {t.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div className="dt-filter-group">
            <select value={conditionFilter} onChange={e => setConditionFilter(e.target.value)}>
              <option value="all">All Conditions</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="dt-table-wrapper">
          <table className="dt-table">
            <thead>
              <tr>
                <th>Type</th>
                <th className="dt-sortable" onClick={() => toggleSort("name")}>
                  Name <ArrowUpDown size={12} />
                </th>
                <th>Tehsil</th>
                <th className="dt-sortable" onClick={() => toggleSort("condition")}>
                  Condition <ArrowUpDown size={12} />
                </th>
                <th className="dt-sortable" onClick={() => toggleSort("risk_score")}>
                  Risk <ArrowUpDown size={12} />
                </th>
                <th>Capacity</th>
                <th className="dt-sortable" onClick={() => toggleSort("year_built")}>
                  Year <ArrowUpDown size={12} />
                </th>
                <th>Last Inspection</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className={item.condition === "poor" || item.condition === "critical" ? "dt-row-alert" : ""}>
                  <td><span className="dt-type-icon">{TYPE_ICONS[item.type] || "🏢"}</span></td>
                  <td className="dt-cell-name">{item.name}</td>
                  <td>{item.tehsil}</td>
                  <td><Badge variant={conditionBadgeVariant(item.condition)}>{item.condition}</Badge></td>
                  <td>
                    <div className="dt-risk-cell">
                      <div className="dt-risk-mini-bar">
                        <div
                          style={{
                            width: `${item.risk_score}%`,
                            background: item.risk_score >= 70 ? "#f87171" : item.risk_score >= 50 ? "#fbbf24" : "#34d399",
                          }}
                        />
                      </div>
                      <span>{item.risk_score}</span>
                    </div>
                  </td>
                  <td className="dt-cell-mono">{item.capacity}</td>
                  <td>{item.year_built}</td>
                  <td className="dt-cell-date">{new Date(item.last_inspection).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="dt-empty">No infrastructure assets match your filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
