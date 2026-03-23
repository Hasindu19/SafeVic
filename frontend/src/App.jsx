import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ReportPage from "../pages/ReportPage";
import DashboardPage from "../pages/DashboardPage";
import MapPage from "../pages/MapPage";

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-slate-100">
                <nav className="bg-slate-900 text-white shadow-md">
                    <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                        <h1 className="text-2xl font-bold tracking-wide">SafeVic</h1>
                        <div className="flex gap-6">
                            <Link to="/" className="hover:text-cyan-400">Map</Link>
                            <Link to="/report" className="hover:text-cyan-400">Report</Link>
                            <Link to="/dashboard" className="hover:text-cyan-400">Dashboard</Link>
                        </div>
                    </div>
                </nav>

                <main className="max-w-6xl mx-auto px-4 py-8">
                    <Routes>
                        <Route path="/" element={<MapPage />} />
                        <Route path="/report" element={<ReportPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;