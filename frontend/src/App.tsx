import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import MapView from "./pages/MapView";
import Infrastructure from "./pages/Infrastructure";
import Sensors from "./pages/Sensors";
import AIPredictions from "./pages/AIPredictions";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/infrastructure" element={<Infrastructure />} />
          <Route path="/sensors" element={<Sensors />} />
          <Route path="/ai-predictions" element={<AIPredictions />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
