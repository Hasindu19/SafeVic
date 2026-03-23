import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ReportPage from "../pages/ReportPage.jsx";
import DashboardPage from "../pages/DashboardPage";
import MapPage from "../pages/MapPage";

function App() {
  return (
      <BrowserRouter>
        <nav style={{ padding: "20px", display: "flex", gap: "15px" }}>
          <Link to="/">Report</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/map">Map</Link>
        </nav>

        <Routes>
          <Route path="/" element={<ReportPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;