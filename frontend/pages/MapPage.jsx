import { useEffect, useState } from "react";
import api from "../services/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapPage() {
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

    return (
        <div style={{ padding: "20px" }}>
            <h2>Incident Map</h2>
            <MapContainer
                center={[-37.8136, 144.9631]}
                zoom={10}
                style={{ height: "500px", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {reports.map((report) => (
                    <Marker
                        key={report.id}
                        position={[Number(report.latitude), Number(report.longitude)]}
                    >
                        <Popup>
                            <strong>{report.incident_type}</strong><br />
                            {report.suburb}<br />
                            {report.description}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}