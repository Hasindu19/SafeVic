import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api.js";
import {
    clearLocationWatch,
    getCurrentLocation,
    getLocationErrorMessage,
    watchCurrentLocation,
} from "../services/location.js";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Circle,
    useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import {
    formatSeverity,
    severityStyles,
} from "../utils/reportPresentation.js";
import "leaflet/dist/leaflet.css";


const defaultCenter = [-37.8136, 144.9631];

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

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

const userBlueDotIcon = L.divIcon({
    className: "custom-user-dot-wrapper",
    html: `<div class="custom-user-dot"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

function MapController({ center, zoom, triggerKey }) {
    const map = useMap();

    useEffect(() => {
        if (!center) return;

        const currentCenter = map.getCenter();
        const distanceKm =
            map.distance([currentCenter.lat, currentCenter.lng], center) / 1000;

        let targetZoom = zoom;
        let duration = 0.35;

        if (distanceKm > 20) {
            targetZoom = 12;
            duration = 0.8;
        } else if (distanceKm > 5) {
            targetZoom = 13;
            duration = 0.55;
        }

        map.flyTo(center, targetZoom, {
            duration,
            easeLinearity: 1,
            noMoveStart: true,
        });

        const timer = setTimeout(() => {
            map.setView(center, zoom, { animate: false });
        }, duration * 1000 + 50);

        return () => clearTimeout(timer);
    }, [center, zoom, triggerKey, map]);

    return null;
}

export default function MapPage() {
    const [reports, setReports] = useState([]);
    const [userLocation, setUserLocation] = useState(defaultCenter);
    const [hasRealLocation, setHasRealLocation] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [locationError, setLocationError] = useState("");
    const [radiusKm, setRadiusKm] = useState(5);
    const [heatmapEnabled, setHeatmapEnabled] = useState(false);

    const [recenterTarget, setRecenterTarget] = useState(defaultCenter);
    const [recenterKey, setRecenterKey] = useState(0);

    const [followMe, setFollowMe] = useState(false);

    const navigate = useNavigate();
    const watchIdRef = useRef(null);

    const fetchReports = useCallback(async () => {
        try {
            const res = await api.get("/reports");
            setReports(res.data);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        }
    }, []);

    const recenterMapTo = useCallback((coords) => {
        setRecenterTarget([...coords]);
        setRecenterKey((prev) => prev + 1);
    }, []);

    const getUserLocation = useCallback(async (autoCenter = false) => {
        setLoadingLocation(true);
        setLocationError("");

        try {
            const { coords } = await getCurrentLocation({
                highAccuracy: false,
                timeout: 5000,
                maximumAge: 60000,
            });

            setUserLocation(coords);
            setHasRealLocation(true);

            if (autoCenter) {
                recenterMapTo(coords);
            }
        } catch (error) {
            console.error("Location error:", error);
            setHasRealLocation(false);
            setLocationError(getLocationErrorMessage(error));
        } finally {
            setLoadingLocation(false);
        }
    }, [recenterMapTo]);

    const stopFollowingLocation = useCallback(() => {
        if (watchIdRef.current !== null) {
            clearLocationWatch(watchIdRef.current).catch((error) => {
                console.error("Clear location watch error:", error);
            });
            watchIdRef.current = null;
        }
    }, []);

    const startFollowingLocation = useCallback(() => {
        stopFollowingLocation();
        setLocationError("");

        watchCurrentLocation(
            ({ coords }) => {
                setUserLocation(coords);
                setHasRealLocation(true);
                setLoadingLocation(false);

                recenterMapTo(coords);
            },
            (error) => {
                console.error("Follow location error:", error);

                setLocationError(
                    getLocationErrorMessage(error, "Could not follow your location.")
                );

                setFollowMe(false);
            },
            {
                highAccuracy: true,
                maximumAge: 5000,
                timeout: 8000,
            }
        )
            .then((watchId) => {
                watchIdRef.current = watchId;
            })
            .catch((error) => {
                console.error("Start follow location error:", error);
                setLocationError(
                    getLocationErrorMessage(error, "Could not follow your location.")
                );
                setFollowMe(false);
            });
    }, [recenterMapTo, stopFollowingLocation]);

    useEffect(() => {
        fetchReports();
        getUserLocation(true);
    }, [fetchReports, getUserLocation]);

    useEffect(() => {
        if (followMe) {
            startFollowingLocation();
        } else {
            stopFollowingLocation();
        }

        return () => {
            stopFollowingLocation();
        };
    }, [followMe, startFollowingLocation, stopFollowingLocation]);

    const handleLocateMe = () => {
        getUserLocation(true);
    };

    const handleToggleFollowMe = () => {
        setFollowMe((prev) => !prev);
    };

    const nearbyReports = useMemo(() => {
        if (!hasRealLocation) return reports;

        return reports.filter((report) => {
            const distance = calculateDistanceKm(
                userLocation[0],
                userLocation[1],
                Number(report.latitude),
                Number(report.longitude)
            );
            return distance <= radiusKm;
        });
    }, [reports, hasRealLocation, userLocation, radiusKm]);

    const anonymousCount = nearbyReports.filter((r) => r.is_anonymous).length;
    const heatmapPoints = useMemo(() => {
        const groupedPoints = new Map();

        nearbyReports.forEach((report) => {
            const latitude = Number(report.latitude);
            const longitude = Number(report.longitude);

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                return;
            }

            const key = `${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
            const current = groupedPoints.get(key);

            if (current) {
                current.intensity += 1;
                return;
            }

            groupedPoints.set(key, { latitude, longitude, intensity: 1 });
        });

        return [...groupedPoints.values()];
    }, [nearbyReports]);

    return (
        <div className="space-y-6">
            <section className="card p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                            SafeVic Platform
                        </p>
                        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                            Community Safety Map
                        </h1>
                        <p className="mt-3 max-w-2xl text-slate-500">
                            Explore nearby incidents, monitor local safety patterns, and report
                            new community issues through an interactive live map.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
                            <p className="text-sm text-slate-500">Nearby Incidents</p>
                            <p className="mt-2 text-3xl font-bold text-slate-900">
                                {nearbyReports.length}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
                            <p className="text-sm text-slate-500">Search Radius</p>
                            <p className="mt-2 text-3xl font-bold text-slate-900">
                                {radiusKm} km
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
                            <p className="text-sm text-slate-500">Anonymous Reports</p>
                            <p className="mt-2 text-3xl font-bold text-slate-900">
                                {anonymousCount}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {locationError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800 shadow-sm">
                    {locationError}
                </div>
            )}

            <section className="card overflow-hidden">
                <div className="border-b border-slate-200 bg-white/80 px-6 py-5 backdrop-blur">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900">
                                Live Incident View
                            </h2>
                            <p className="mt-1 text-slate-500">
                                Showing {nearbyReports.length} incident(s)
                                {hasRealLocation ? ` within ${radiusKm} km of your location` : ""}
                            </p>
                        </div>

                        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
                            <select
                                value={radiusKm}
                                onChange={(e) => setRadiusKm(Number(e.target.value))}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 sm:w-auto"
                            >
                                <option value={1}>1 km</option>
                                <option value={3}>3 km</option>
                                <option value={5}>5 km</option>
                                <option value={10}>10 km</option>
                                <option value={20}>20 km</option>
                            </select>

                            <button
                                type="button"
                                onClick={() => setHeatmapEnabled((enabled) => !enabled)}
                                className={`${heatmapEnabled ? "btn-primary" : "btn-secondary"} min-h-12 w-full sm:w-auto`}
                                aria-pressed={heatmapEnabled}
                            >
                                Heatmap: {heatmapEnabled ? "ON" : "OFF"}
                            </button>

                            <button
                                onClick={handleLocateMe}
                                className="btn-primary min-h-12 w-full sm:w-auto"
                                aria-label="Locate my current position on the map"
                                title="Locate my current position"
                            >
                                {loadingLocation ? "Locating..." : "Locate Me"}
                            </button>

                            <button
                                onClick={handleToggleFollowMe}
                                className={`${followMe ? "btn-primary" : "btn-secondary"} min-h-12 w-full sm:w-auto`}
                                aria-label={followMe ? "Stop following my location" : "Follow my location"}
                                title={followMe ? "Stop following my location" : "Follow my location"}
                            >
                                {followMe ? "Follow Me: ON" : "Follow Me: OFF"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Important: keep map layers below navbar */}
                <div className="relative z-0 p-4">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
                        <MapContainer
                            center={defaultCenter}
                            zoom={13}
                            scrollWheelZoom={true}
                            touchZoom={true}
                            dragging={true}
                            tap={true}
                            className="h-[calc(100vh-220px)] min-h-[420px] md:h-[calc(100vh-180px)] md:min-h-[500px] w-full"
                        >
                            <TileLayer
                                attribution="&copy; OpenStreetMap contributors"
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <MapController
                                center={recenterTarget}
                                zoom={15}
                                triggerKey={recenterKey}
                            />

                            {heatmapEnabled &&
                                heatmapPoints.map((point) => (
                                    // TODO: replace the density-circle fallback with a React 19 compatible heatmap layer when available.
                                    <Circle
                                        key={`heat-${point.latitude}-${point.longitude}`}
                                        center={[point.latitude, point.longitude]}
                                        radius={100 + point.intensity * 45}
                                        interactive={false}
                                        pathOptions={{
                                            color: "#ef4444",
                                            fillColor: point.intensity > 2 ? "#ef4444" : "#f59e0b",
                                            fillOpacity: Math.min(0.18 + point.intensity * 0.1, 0.55),
                                            weight: 0,
                                        }}
                                    />
                                ))}

                            {hasRealLocation && (
                                <>
                                    <Circle
                                        center={userLocation}
                                        radius={70}
                                        pathOptions={{
                                            color: "#60a5fa",
                                            fillColor: "#93c5fd",
                                            fillOpacity: 0.22,
                                            weight: 1,
                                        }}
                                    />
                                    <Marker position={userLocation} icon={userBlueDotIcon}>
                                        <Popup>{followMe ? "Following your location" : "You are here"}</Popup>
                                    </Marker>
                                </>
                            )}

                            <MarkerClusterGroup chunkedLoading>
                                {nearbyReports.map((report) => (
                                    <Marker
                                        key={report.id}
                                        position={[Number(report.latitude), Number(report.longitude)]}
                                        icon={
                                            incidentIcons[report.incident_type] || incidentIcons.default
                                        }
                                    >
                                        <Popup>
                                            <div className="w-[190px] max-w-[70vw] space-y-2 px-0.5 text-center">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {report.incident_type}
                                                </p>

                                                <p className="text-sm text-slate-700">
                                                    {report.suburb}
                                                </p>

                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${severityStyles[report.severity] || severityStyles.medium}`}>
                                                    {formatSeverity(report.severity)} severity
                                                </span>

                                                {report.image_url && (
                                                    <img
                                                        src={report.image_url}
                                                        alt=""
                                                        className="mx-auto h-20 w-full rounded-lg object-cover"
                                                    />
                                                )}

                                                <p className="line-clamp-3 break-words text-sm text-slate-500">
                                                    {report.description}
                                                </p>

                                                <p className="text-xs uppercase tracking-wide text-slate-400">
                                                    Status: {report.status}
                                                </p>

                                                <Link
                                                    to={`/incidents/${report.id}`}
                                                    className="mt-2 flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-2 text-sm font-semibold shadow transition duration-200 hover:from-cyan-700 hover:to-blue-700 hover:shadow-lg"
                                                    style={{ color: "#ffffff", textDecoration: "none" }}
                                                >
                                                    View Details
                                                </Link>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MarkerClusterGroup>
                        </MapContainer>
                    </div>

                    <button
                        onClick={() => navigate("/report")}
                        className="absolute bottom-6 right-6 z-[1000] flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-4xl text-white shadow-2xl transition hover:scale-110 md:bottom-8 md:right-8"
                        aria-label="Report incident"
                        title="Report incident"
                    >
                        +
                    </button>
                </div>
            </section>

            <section className="card p-6">
                <h3 className="text-xl font-semibold text-slate-900">
                    Incident Categories
                </h3>
                <p className="mt-1 text-slate-500">
                    Marker colours represent different incident categories on the map.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                    <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-700">
                        Car Theft
                    </span>
                    <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700">
                        Assault
                    </span>
                    <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700">
                        Burglary
                    </span>
                    <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700">
                        Vandalism
                    </span>
                    <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
                        Suspicious Activity
                    </span>
                    <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
                        Your Location
                    </span>
                </div>
            </section>
        </div>
    );
}
