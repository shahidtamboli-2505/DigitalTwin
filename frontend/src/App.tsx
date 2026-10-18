import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import TwinMap from "./pages/TwinMap";
import Infrastructure from "./pages/Infrastructure";
import Sensors from "./pages/Sensors";
import AIPredictions from "./pages/AIPredictions";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import AIModeler from "./pages/AIModeler";
import DigitalTwin3D from "./pages/DigitalTwin3D";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/map" element={<TwinMap />} />
          <Route path="/infrastructure" element={<Infrastructure />} />
          <Route path="/sensors" element={<Sensors />} />
          <Route path="/ai-predictions" element={<AIPredictions />} />
          <Route path="/twin" element={<DigitalTwin3D />} />
          <Route path="/ai-modeler" element={<AIModeler />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
