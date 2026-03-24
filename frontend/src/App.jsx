import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "../components/Navbar";
import MapPage from "../pages/MapPage";
import ReportPage from "../pages/ReportPage";
import DashboardPage from "../pages/DashboardPage";

function App() {
    return (
        <BrowserRouter>
            <Navbar/>
            <main className="mx-auto max-w-7xl px-4 py-6 pt-24">
                <Routes>
                    <Route path="/" element={<MapPage/>}/>
                    <Route path="/report" element={<ReportPage/>}/>
                    <Route path="/dashboard" element={<DashboardPage/>}/>
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default App;