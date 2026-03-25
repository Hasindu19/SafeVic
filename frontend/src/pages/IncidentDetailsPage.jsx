import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import api from "../services/api.js";
import "leaflet/dist/leaflet.css";

const incidentIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export default function IncidentDetailsPage() {
    const { id } = useParams();
    const [incident, setIncident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchIncident();
    }, [id]);

    const fetchIncident = async () => {
        try {
            const res = await api.get(`/reports/${id}`);
            setIncident(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setError("Failed to load incident details");
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-slate-600">Loading incident details...</div>;
    }

    if (error) {
        return <div className="text-red-600">{error}</div>;
    }

    if (!incident) {
        return <div className="text-slate-600">Incident not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="card p-7">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                            Incident Details
                        </p>
                        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                            {incident.incident_type}
                        </h1>
                        <p className="mt-3 text-slate-500">
                            Full incident information and focused location view.
                        </p>
                    </div>

                    <Link to="/" className="btn-secondary">
                        Back to Map
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="card p-6 space-y-4">
                    <div>
                        <p className="text-sm text-slate-500">Incident Type</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                            {incident.incident_type}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">Description</p>
                        <p className="mt-1 text-slate-800">
                            {incident.description}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">Suburb</p>
                        <p className="mt-1 text-slate-800">{incident.suburb}</p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">Incident Time</p>
                        <p className="mt-1 text-slate-800">
                            {new Date(incident.incident_time).toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">Status</p>
                        <span className="mt-1 inline-block rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {incident.status}
            </span>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">Anonymous</p>
                        <p className="mt-1 text-slate-800">
                            {incident.is_anonymous ? "Yes" : "No"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">Coordinates</p>
                        <p className="mt-1 text-slate-800">
                            {Number(incident.latitude).toFixed(6)}, {Number(incident.longitude).toFixed(6)}
                        </p>
                    </div>
                </section>

                <section className="card p-4">
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <MapContainer
                            center={[Number(incident.latitude), Number(incident.longitude)]}
                            zoom={15}
                            scrollWheelZoom={true}
                            className="h-[500px] w-full"
                        >
                            <TileLayer
                                attribution="&copy; OpenStreetMap contributors"
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <Marker
                                position={[Number(incident.latitude), Number(incident.longitude)]}
                                icon={incidentIcon}
                            >
                                <Popup>
                                    <div className="space-y-1">
                                        <p className="font-semibold">{incident.incident_type}</p>
                                        <p>{incident.suburb}</p>
                                        <p className="text-sm text-slate-600">{incident.description}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    </div>
                </section>
            </div>
        </div>
    );
}