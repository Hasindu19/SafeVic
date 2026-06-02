import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import MapPage from "./pages/MapPage";
import SafetyFeedPage from "./pages/SafetyFeedPage";
import AlertSettingsPage from "./pages/AlertSettingsPage";
import ReportPage from "./pages/ReportPage";
import DashboardPage from "./pages/DashboardPage";
import IncidentDetailsPage from "./pages/IncidentDetailsPage";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignUpPage";
import ProtectedRoute from "./components/ProtectedRoute";
import MyReportsPage from "./pages/MyReportsPage";
import {
    NOTIFICATION_REPORT_EVENT,
    PENDING_REPORT_ID_KEY,
    registerPushNotifications,
} from "./services/pushNotifications.js";

function NotificationNavigation() {
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem("safevic_token")) {
            registerPushNotifications();
        }

        const openReport = (reportId) => {
            if (!reportId) {
                return;
            }

            localStorage.removeItem(PENDING_REPORT_ID_KEY);
            navigate(`/incidents/${encodeURIComponent(reportId)}`);
        };

        openReport(localStorage.getItem(PENDING_REPORT_ID_KEY));

        const handleNotificationReport = (event) => {
            openReport(event.detail?.reportId);
        };

        window.addEventListener(NOTIFICATION_REPORT_EVENT, handleNotificationReport);

        return () => {
            window.removeEventListener(NOTIFICATION_REPORT_EVENT, handleNotificationReport);
        };
    }, [navigate]);

    return null;
}

function App() {
    return (
        <BrowserRouter>
            <NotificationNavigation />
            <div className="safevic-app-shell">
                <div className="safevic-status-bar-guard" aria-hidden="true" />
                <Navbar/>
                <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/map" element={<MapPage />} />
                        <Route path="/feed" element={<SafetyFeedPage />} />
                        <Route
                            path="/report"
                            element={
                                <ProtectedRoute allowedRoles={["community", "council", "police_admin"]}>
                                    <ReportPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/my-reports"
                            element={
                                <ProtectedRoute allowedRoles={["community", "council", "police_admin"]}>
                                    <MyReportsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/alert-settings"
                            element={
                                <ProtectedRoute allowedRoles={["community", "council", "police_admin"]}>
                                    <AlertSettingsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
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
            </div>
        </BrowserRouter>
    );
}

export default App;
