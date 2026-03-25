import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import MapPage from "./pages/MapPage";
import ReportPage from "./pages/ReportPage";
import DashboardPage from "./pages/DashboardPage";
import IncidentDetailsPage from "./pages/IncidentDetailsPage";

import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <Navbar/>
            <main className="mx-auto max-w-7xl px-4 py-6 pt-24">
                <Routes>
                    <Route path="/" element={<MapPage />} />
                    <Route
                        path="/report"
                        element={
                            <ProtectedRoute allowedRoles={["community", "council", "police_admin"]}>
                                <ReportPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/incidents/:id" element={<IncidentDetailsPage />} />

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["council", "police_admin"]}>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default App;