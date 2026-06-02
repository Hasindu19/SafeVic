import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
    formatSeverity,
    formatStatus,
    severityStyles,
    statusStyles,
} from "../utils/reportPresentation.js";
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
    const [statusHistory, setStatusHistory] = useState([]);

    useEffect(() => {
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

        fetchIncident();
    }, [id]);

    useEffect(() => {
        if (!user) {
            return;
        }

        api.get(`/reports/${id}/status-history`)
            .then((result) => setStatusHistory(result.data))
            .catch((historyError) => {
                if (historyError.response?.status !== 403) {
                    console.error("Unable to load status history:", historyError);
                }
            });
    }, [id, user]);

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
            const historyResult = await api.get(`/reports/${incident.id}/status-history`);
            setStatusHistory(historyResult.data);
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
            <section className="card p-5 sm:p-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                            Incident Details
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            {incident.incident_type}
                        </h1>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${statusStyles[incident.status] || "bg-slate-100 text-slate-700"}`}>
                                {formatStatus(incident.status)}
                            </span>
                            <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${severityStyles[incident.severity] || severityStyles.medium}`}>
                                {formatSeverity(incident.severity)} severity
                            </span>
                            <span className="text-sm text-slate-500">Report #{incident.id}</span>
                        </div>
                    </div>

                    <Link to="/map" className="btn-secondary">
                        Back to Map
                    </Link>
                </div>
            </section>

            {statusMessage && (
                <div className="rounded-xl bg-blue-100 px-4 py-3 text-blue-700">
                    {statusMessage}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.03fr_0.97fr]">
                <section className="space-y-5">
                    <div className="card p-5 sm:p-6">
                        <h2 className="text-lg font-semibold text-slate-900">Incident Summary</h2>
                        <p className="mt-4 leading-7 text-slate-700">{incident.description}</p>
                        {incident.image_url && (
                            <img
                                src={incident.image_url}
                                alt="Incident attachment"
                                className="mt-5 max-h-80 w-full rounded-xl object-cover"
                            />
                        )}
                    </div>

                    {user?.role === "police_admin" && (
                        <div className="card p-5 sm:p-6">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="incident-status">
                                Update Incident Status
                            </label>
                            <p className="mt-1 text-sm text-slate-500">Track review progress for community visibility.</p>
                            <select
                                id="incident-status"
                                value={incident.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                            >
                                <option value="pending">Pending</option>
                                <option value="under_review">Under Review</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                        {[
                            ["Incident Type", incident.incident_type],
                            ["Suburb", incident.suburb],
                            ["Severity", formatSeverity(incident.severity)],
                            ["Incident Time", new Date(incident.incident_time).toLocaleString()],
                            ["Created Date", new Date(incident.created_at).toLocaleString()],
                            ["Anonymous", incident.is_anonymous ? "Yes" : "No"],
                            ["Coordinates", `${Number(incident.latitude).toFixed(6)}, ${Number(incident.longitude).toFixed(6)}`],
                        ].map(([label, value]) => (
                            <div key={label} className="card p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                                <p className="mt-2 break-words font-medium text-slate-900">{value}</p>
                            </div>
                        ))}
                    </div>

                    {user && (
                        <div className="card p-5 sm:p-6">
                            <h2 className="text-lg font-semibold text-slate-900">Status Timeline</h2>
                            <div className="mt-5 space-y-5 border-l-2 border-slate-200 pl-5">
                                {(statusHistory.length > 0
                                    ? statusHistory
                                    : [{ id: "current", new_status: incident.status, created_at: incident.created_at }]
                                ).map((historyItem) => (
                                    <div key={historyItem.id} className="relative">
                                        <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-cyan-600 ring-4 ring-white" />
                                        <p className="font-semibold text-slate-900">
                                            {historyItem.old_status
                                                ? `${formatStatus(historyItem.old_status)} to ${formatStatus(historyItem.new_status)}`
                                                : `Created as ${formatStatus(historyItem.new_status)}`}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {new Date(historyItem.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                <section className="card p-4">
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <MapContainer
                            center={[Number(incident.latitude), Number(incident.longitude)]}
                            zoom={15}
                            scrollWheelZoom={true}
                            className="h-[360px] w-full sm:h-[460px] lg:h-[590px]"
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
                                    <div className="w-[190px] max-w-[70vw] space-y-2 px-0.5 text-center">
                                        <p className="font-semibold text-slate-900">
                                            {incident.incident_type}
                                        </p>

                                        <p className="text-sm text-slate-700">
                                            {incident.suburb}
                                        </p>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Severity: {formatSeverity(incident.severity)}
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
