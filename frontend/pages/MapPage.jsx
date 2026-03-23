import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import api from "../services/api";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Circle,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultCenter = [-37.8136, 144.9631];

const incidentIcons = {
    "Car Theft": new L.Icon({
        iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    }),
    Assault: new L.Icon({
        iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    }),
    Burglary: new L.Icon({
        iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    }),
    Vandalism: new L.Icon({
        iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    }),
    "Suspicious Activity": new L.Icon({
        iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    }),
    default: new L.Icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    }),
};

// Google Maps style blue dot using divIcon
const userBlueDotIcon = L.divIcon({
    className: "custom-user-dot-wrapper",
    html: `<div class="custom-user-dot"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

function RecenterMap({ center, zoom = 14 }) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.setView(center, zoom, {
                animate: true,
            });
        }
    }, [center, zoom, map]);

    return null;
}

export default function MapPage() {
    const [reports, setReports] = useState([]);
    const [userLocation, setUserLocation] = useState(defaultCenter);
    const [hasRealLocation, setHasRealLocation] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [locationError, setLocationError] = useState("");
    const [recenterTarget, setRecenterTarget] = useState(null);

    const navigate = useNavigate();
    const mapRef = useRef(null);

    useEffect(() => {
        fetchReports();
        getUserLocation(true);
    }, []);

    const fetchReports = async () => {
        try {
            const res = await api.get("/reports");
            setReports(res.data);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        }
    };

    const getUserLocation = (autoCenter = false) => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser.");
            setLoadingLocation(false);
            return;
        }

        setLoadingLocation(true);
        setLocationError("");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = [
                    position.coords.latitude,
                    position.coords.longitude,
                ];

                setUserLocation(coords);
                setHasRealLocation(true);
                setLoadingLocation(false);

                if (autoCenter) {
                    setRecenterTarget([...coords]);;
                }
            },
            (error) => {
                console.error("Location error:", error);
                setLoadingLocation(false);
                setHasRealLocation(false);

                if (error.code === 1) {
                    setLocationError("Location access was denied.");
                } else if (error.code === 2) {
                    setLocationError("Unable to detect your location.");
                } else if (error.code === 3) {
                    setLocationError("Location request timed out.");
                } else {
                    setLocationError("Could not get your current location.");
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const handleLocateMe = () => {
        getUserLocation(true);
    };

    const mapCenter = useMemo(() => userLocation || defaultCenter, [userLocation]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Incident Map</h2>
                    <p className="text-slate-500 mt-1">
                        View incidents near your location and report a new one.
                    </p>
                </div>

                <button
                    onClick={handleLocateMe}
                    className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-4 py-3 text-white font-medium shadow hover:bg-cyan-700 transition"
                >
                    {loadingLocation ? "Locating..." : "Locate Me"}
                </button>
            </div>

            {locationError && (
                <div className="rounded-xl bg-amber-100 px-4 py-3 text-amber-800">
                    {locationError}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow p-4 relative">
                <MapContainer
                    center={mapCenter}
                    zoom={13}
                    scrollWheelZoom={true}
                    style={{ height: "600px", width: "100%", borderRadius: "16px" }}
                    ref={mapRef}
                >
                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {recenterTarget && <RecenterMap center={recenterTarget} zoom={15} />}

                    {hasRealLocation && (
                        <>
                            <Marker position={userLocation} icon={userBlueDotIcon}>
                                <Popup>You are here</Popup>
                            </Marker>

                            <Circle
                                center={userLocation}
                                radius={60}
                                pathOptions={{
                                    color: "#2563eb",
                                    fillColor: "#60a5fa",
                                    fillOpacity: 0.2,
                                    weight: 1,
                                }}
                            />
                        </>
                    )}

                    {reports.map((report) => (
                        <Marker
                            key={report.id}
                            position={[Number(report.latitude), Number(report.longitude)]}
                            icon={incidentIcons[report.incident_type] || incidentIcons.default}
                        >
                            <Popup>
                                <div className="space-y-1">
                                    <p className="font-semibold">{report.incident_type}</p>
                                    <p>{report.suburb}</p>
                                    <p className="text-sm text-slate-600">{report.description}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                <button
                    onClick={() => navigate("/report")}
                    className="absolute bottom-8 right-8 z-[1000] flex items-center justify-center bg-slate-900 text-white w-14 h-14 rounded-full text-3xl shadow-lg hover:bg-slate-800 transition"
                    aria-label="Report incident"
                    title="Report incident"
                >
                    +
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow p-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Map Legend</h3>
                <div className="flex flex-wrap gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700">
            Car Theft
          </span>
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700">
            Assault
          </span>
                    <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700">
            Burglary
          </span>
                    <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
            Vandalism
          </span>
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">
            Suspicious Activity
          </span>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">
            Your Location
          </span>
                </div>
            </div>
        </div>
    );
}