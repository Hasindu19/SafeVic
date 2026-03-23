import { useEffect, useState } from "react";
import api from "../services/api";

export default function DashboardPage() {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await api.get("/reports");
            setReports(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const hotspotCount = {};
    reports.forEach((report) => {
        hotspotCount[report.suburb] = (hotspotCount[report.suburb] || 0) + 1;
    });

    return (
        <div style={{ padding: "20px" }}>
            <h2>Admin Dashboard</h2>

            <h3>Hotspot Summary</h3>
            <ul>
                {Object.entries(hotspotCount).map(([suburb, count]) => (
                    <li key={suburb}>
                        {suburb}: {count} reports
                    </li>
                ))}
            </ul>

            <h3>All Reports</h3>
            <table border="1" cellPadding="10">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Incident</th>
                    <th>Suburb</th>
                    <th>Status</th>
                    <th>Anonymous</th>
                </tr>
                </thead>
                <tbody>
                {reports.map((report) => (
                    <tr key={report.id}>
                        <td>{report.id}</td>
                        <td>{report.incident_type}</td>
                        <td>{report.suburb}</td>
                        <td>{report.status}</td>
                        <td>{report.is_anonymous ? "Yes" : "No"}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}