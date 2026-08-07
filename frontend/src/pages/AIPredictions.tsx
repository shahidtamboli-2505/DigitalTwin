import { Brain, TrendingUp, Shield, AlertTriangle, MapPin, CheckCircle2, Target } from "lucide-react";
import GaugeChart from "../components/charts/GaugeChart";
import Badge from "../components/ui/Badge";
import { RISK_PREDICTIONS } from "../data/sangli-district";

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  flood: { icon: "🌊", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.1)" },
  drought: { icon: "☀️", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.1)" },
  heat_wave: { icon: "🔥", color: "#f87171", bg: "rgba(248, 113, 113, 0.1)" },
  infrastructure_failure: { icon: "🏗️", color: "#a78bfa", bg: "rgba(167, 139, 250, 0.1)" },
  landslide: { icon: "⛰️", color: "#fb923c", bg: "rgba(251, 146, 60, 0.1)" },
};

export default function AIPredictions() {
  return (
    <div className="dt-page">
      <div className="dt-page-header">
        <div>
          <h1 className="dt-page-title">AI Risk Prediction Engine</h1>
          <p className="dt-page-subtitle">
            Machine learning-powered risk assessment for Sangli District
          </p>
        </div>
        <div className="dt-ai-badge">
          <Brain size={16} />
          <span>AI-Powered</span>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="dt-ai-summary-strip">
        <div className="dt-ai-summary-item">
          <Target size={16} />
          <span className="dt-ai-summary-value">{RISK_PREDICTIONS.length}</span>
          <span className="dt-ai-summary-label">Active Predictions</span>
        </div>
        <div className="dt-ai-summary-item">
          <TrendingUp size={16} />
          <span className="dt-ai-summary-value">{(RISK_PREDICTIONS.reduce((s, p) => s + p.confidence, 0) / RISK_PREDICTIONS.length * 100).toFixed(0)}%</span>
          <span className="dt-ai-summary-label">Avg Confidence</span>
        </div>
        <div className="dt-ai-summary-item">
          <AlertTriangle size={16} />
          <span className="dt-ai-summary-value">{RISK_PREDICTIONS.filter(p => p.probability >= 0.5).length}</span>
          <span className="dt-ai-summary-label">High Probability</span>
        </div>
        <div className="dt-ai-summary-item">
          <Shield size={16} />
          <span className="dt-ai-summary-value">{RISK_PREDICTIONS.reduce((s, p) => s + p.affected_tehsils.length, 0)}</span>
          <span className="dt-ai-summary-label">Tehsils at Risk</span>
        </div>
      </div>

      {/* Predictions Grid */}
      <div className="dt-predictions-grid">
        {RISK_PREDICTIONS.sort((a, b) => b.probability - a.probability).map(pred => {
          const config = CATEGORY_CONFIG[pred.category] || { icon: "⚠️", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
          return (
            <div key={pred.id} className="dt-prediction-card" style={{ borderLeftColor: config.color }}>
              <div className="dt-prediction-header">
                <div className="dt-prediction-category" style={{ background: config.bg }}>
                  <span>{config.icon}</span>
                  <span style={{ color: config.color }}>{pred.category.replace("_", " ")}</span>
                </div>
                <Badge
                  variant={pred.probability >= 0.6 ? "high" : pred.probability >= 0.3 ? "medium" : "low"}
                >
                  {pred.timeframe}
                </Badge>
              </div>

              <h3 className="dt-prediction-title">{pred.title}</h3>

              <div className="dt-prediction-gauges">
                <GaugeChart value={pred.probability} label="Probability" size={110} color={config.color} />
                <GaugeChart value={pred.confidence} label="Confidence" size={110} />
              </div>

              <div className="dt-prediction-severity">
                <span className="dt-prediction-label">Severity if occurs:</span>
                <Badge variant={
                  pred.severity_if_occurs === "catastrophic" ? "critical" :
                  pred.severity_if_occurs === "severe" ? "high" :
                  pred.severity_if_occurs === "moderate" ? "medium" : "low"
                }>
                  {pred.severity_if_occurs}
                </Badge>
              </div>

              {/* Affected Tehsils */}
              <div className="dt-prediction-tehsils">
                <MapPin size={14} />
                <div className="dt-prediction-tehsil-list">
                  {pred.affected_tehsils.map(t => (
                    <span key={t} className="dt-prediction-tehsil-tag">{t}</span>
                  ))}
                </div>
              </div>

              {/* Key Factors */}
              <div className="dt-prediction-section">
                <h4 className="dt-prediction-section-title">
                  <AlertTriangle size={14} />
                  Key Risk Factors
                </h4>
                <ul className="dt-prediction-factors">
                  {pred.key_factors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              {/* Recommended Actions */}
              <div className="dt-prediction-section">
                <h4 className="dt-prediction-section-title">
                  <CheckCircle2 size={14} />
                  Recommended Actions
                </h4>
                <ul className="dt-prediction-actions">
                  {pred.recommended_actions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
