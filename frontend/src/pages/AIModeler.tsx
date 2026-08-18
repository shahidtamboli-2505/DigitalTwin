import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, ScanLine, Layers, Upload, Box, ShieldAlert, Activity, CheckCircle, BrainCircuit } from "lucide-react";
import { INFRASTRUCTURE } from "../data/sangli-district";

const PROCESSING_STEPS = [
  "Acquiring satellite telemetry...",
  "Analyzing topological structure...",
  "Running neural photogrammetry...",
  "Generating multi-layer mesh...",
  "Applying material textures...",
  "Calibrating to digital twin coordinate system...",
  "Optimization complete."
];

import { Link } from "react-router-dom";

export default function AIModeler() {
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [complete, setComplete] = useState(false);

  const assetInfo = INFRASTRUCTURE.find(i => i.id === selectedAsset);

  useEffect(() => {
    if (processing) {
      if (stepIndex < PROCESSING_STEPS.length) {
        const timer = setTimeout(() => {
          setStepIndex(prev => prev + 1);
        }, 1200 + Math.random() * 800);
        return () => clearTimeout(timer);
      } else {
        setProcessing(false);
        setComplete(true);
      }
    }
  }, [processing, stepIndex]);

  const handleStart = () => {
    if (!selectedAsset) return;
    setProcessing(true);
    setStepIndex(0);
    setComplete(false);
  };

  return (
    <div className="dt-page dt-jarvis-page">
      <div className="dt-page-header">
        <div>
          <h1 className="dt-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', textShadow: '0 0 10px rgba(56,189,248,0.5)' }}>
            <BrainCircuit size={24} /> J.A.R.V.I.S. 3D Constructor
          </h1>
          <p className="dt-page-subtitle">Automated Neural Photogrammetry to Digital Twin Agent</p>
        </div>
        <div className="dt-live-indicator dt-hud-badge">
          <Activity size={14} /> SYSTEM: ONLINE
        </div>
      </div>

      <div className="dt-grid-2">
        {/* Control Panel */}
        <div className="dt-card dt-hud-panel">
          <div className="dt-card-header dt-hud-header">
             <h3 className="dt-card-title"><ScanLine size={18} /> Acquisition Parameters</h3>
          </div>
          <div className="dt-card-body dt-hud-body">
            
            <div className="dt-hud-field">
              <label>Target Infrastructure Sequence</label>
              <select 
                value={selectedAsset} 
                onChange={(e) => { setSelectedAsset(e.target.value); setComplete(false); }}
                className="dt-hud-select"
                disabled={processing}
              >
                <option value="">-- Initialize Target --</option>
                {INFRASTRUCTURE.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name} [{asset.type.toUpperCase()}]</option>
                ))}
              </select>
            </div>

            <AnimatePresence>
              {assetInfo && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="dt-hud-asset-info">
                  <div className="dt-hud-detail"><span>COORDINATES:</span> {assetInfo.lat.toFixed(4)}, {assetInfo.lng.toFixed(4)}</div>
                  <div className="dt-hud-detail"><span>CLASSIFICATION:</span> {assetInfo.type}</div>
                  <div className="dt-hud-detail"><span>RISK INDEX:</span> {assetInfo.risk_score}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="dt-hud-upload-zone" onClick={() => selectedAsset && !processing && handleStart()} style={{ opacity: selectedAsset ? 1 : 0.5, cursor: selectedAsset ? 'pointer' : 'not-allowed' }}>
              {!processing && !complete ? (
                <>
                  <Upload size={32} className="dt-hud-glow-icon" />
                  <h4>SYNC SATELLITE / UPLOAD IMAGERY</h4>
                  <p>Click to initiate automated topological reconstruction</p>
                </>
              ) : processing ? (
                <>
                  <Cpu size={32} className="dt-hud-glow-icon dt-spin" />
                  <h4>PROCESSING NEURAL MESH</h4>
                  <p>Do not terminate connection...</p>
                </>
              ) : (
                <>
                  <CheckCircle size={32} style={{ color: '#34d399' }} />
                  <h4 style={{ color: '#34d399' }}>TWIN GENERATED</h4>
                  <p>Ready for map deployment</p>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Display Panel */}
        <div className="dt-card dt-hud-display">
           <div className="dt-hud-scanner-overlay" />
           {processing ? (
             <div className="dt-hud-logs">
                <div className="dt-hud-wireframe-anim">
                  <Box size={80} className="dt-pulse-fast" color="#38bdf8" />
                  <div className="dt-scan-line-v"></div>
                </div>
                <div className="dt-log-stream">
                  {PROCESSING_STEPS.slice(0, stepIndex + 1).map((step, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className="dt-log-line"
                    >
                      {"> "}{step}
                    </motion.div>
                  ))}
                  {stepIndex < PROCESSING_STEPS.length && (
                    <div className="dt-log-cursor">_</div>
                  )}
                </div>
             </div>
           ) : complete ? (
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="dt-hud-success">
               <Layers size={64} style={{ color: '#34d399', marginBottom: '16px' }} />
               <h3>3D TWIN CONSTRUCTED</h3>
               <p>Model ID: {selectedAsset}-TWIN-GLB</p>
               <div className="dt-hud-stats">
                 <div>Vertices: {(Math.random() * 50000 + 10000).toFixed(0)}</div>
                 <div>Polygons: {(Math.random() * 20000 + 5000).toFixed(0)}</div>
                 <div>Textures: 4K HDR</div>
               </div>
               <Link to="/map" className="dt-hud-btn-primary">DEPLOY TO GIS MAP</Link>
             </motion.div>
           ) : (
             <div className="dt-hud-idle">
               <ShieldAlert size={48} opacity={0.2} />
               <p>AWAITING SATELLITE UPLINK</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
