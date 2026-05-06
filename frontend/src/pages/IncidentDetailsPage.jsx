import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "leaflet/dist/leaflet.css";

const incidentIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export default function IncidentDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();

    const [incident, setIncident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusMessage, setStatusMessage] = useState("");

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

    const handleStatusChange = async (newStatus) => {
        try {
            const token = localStorage.getItem("safevic_token");

            const res = await api.put(
                `/reports/${incident.id}/status`,
                { status: newStatus },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setIncident(res.data.report);
            setStatusMessage("Status updated successfully");
        } catch (error) {
            console.error(error);
            setStatusMessage(
                error.response?.data?.message || "Failed to update status"
            );
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-slate-600">
                Loading incident details...
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl bg-red-100 px-4 py-3 text-red-700">
                {error}
            </div>
        );
    }

    if (!incident) {
        return (
            <div className="rounded-xl bg-amber-100 px-4 py-3 text-amber-700">
                Incident not found.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="card p-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
            </section>

            {statusMessage && (
                <div className="rounded-xl bg-blue-100 px-4 py-3 text-blue-700">
                    {statusMessage}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="card p-6 space-y-5">
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
                        <p className="mt-1 text-slate-800">
                            {incident.suburb}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">Incident Time</p>
                        <p className="mt-1 text-slate-800">
                            {new Date(incident.incident_time).toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">Created At</p>
                        <p className="mt-1 text-slate-800">
                            {new Date(incident.created_at).toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">Status</p>

                        {user?.role === "police_admin" ? (
                            <select
                                value={incident.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-700 outline-none focus:border-cyan-500"
                            >
                                <option value="pending">Pending</option>
                                <option value="under_review">Under Review</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        ) : (
                            <span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {incident.status}
              </span>
                        )}
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
                            {Number(incident.latitude).toFixed(6)},{" "}
                            {Number(incident.longitude).toFixed(6)}
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
                                    <div className="w-[190px] space-y-2 px-0.5 text-center">
                                        <p className="font-semibold text-slate-900">
                                            {incident.incident_type}
                                        </p>

                                        <p className="text-sm text-slate-700">
                                            {incident.suburb}
                                        </p>

                                        <p className="text-sm text-slate-500">
                                            {incident.description}
                                        </p>

                                        <p className="text-xs uppercase tracking-wide text-slate-400">
                                            Status: {incident.status}
                                        </p>
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