import { useEffect, useState } from "react";
import api from "../services/api";
import {
    MapContainer,
    TileLayer,
    Marker,
    Circle,
    useMapEvents,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Default map center if location is unavailable
const defaultCenter = [-37.8136, 144.9631];

// Blue dot for user's current location
const userBlueDotIcon = L.divIcon({
    className: "custom-user-dot-wrapper",
    html: `<div class="custom-user-dot"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

// Marker for selected incident location
const selectedLocationIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Fast smooth map movement
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

// Reverse geocoding to auto-fill suburb
const reverseGeocodeSuburb = async (lat, lng) => {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        );

        const data = await res.json();

        return (
            data.address?.suburb ||
            data.address?.town ||
            data.address?.city_district ||
            data.address?.city ||
            data.address?.municipality ||
            ""
        );
    } catch (error) {
        console.error("Reverse geocoding failed:", error);
        return "";
    }
};

// Distance calculation
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

// Click map to choose incident location
function LocationPicker({ setForm, selectedPosition, setErrors }) {
    useMapEvents({
        async click(e) {
            const { lat, lng } = e.latlng;
            const suburbName = await reverseGeocodeSuburb(lat, lng);

            setForm((prev) => ({
                ...prev,
                latitude: lat,
                longitude: lng,
                suburb: suburbName || prev.suburb,
            }));

            setErrors((prev) => ({
                ...prev,
                location: "",
                suburb: "",
            }));
        },
    });

    return selectedPosition ? (
        <Marker position={selectedPosition} icon={selectedLocationIcon} />
    ) : null;
}

export default function ReportPage() {
    const [form, setForm] = useState({
        incident_type: "",
        description: "",
        suburb: "",
        latitude: "",
        longitude: "",
        incident_time: "",
        is_anonymous: false,
    });

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");

    const [userLocation, setUserLocation] = useState(defaultCenter);
    const [hasRealLocation, setHasRealLocation] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [locationError, setLocationError] = useState("");

    const [recenterTarget, setRecenterTarget] = useState(defaultCenter);
    const [recenterKey, setRecenterKey] = useState(0);

    useEffect(() => {
        getUserLocation(true);
    }, []);

    const recenterMapTo = (coords) => {
        setRecenterTarget([...coords]);
        setRecenterKey((prev) => prev + 1);
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
                    recenterMapTo(coords);
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

    // Only move map back to current user location
    const handleRecenterMap = () => {
        if (hasRealLocation) {
            recenterMapTo(userLocation);
        }
    };

    // Use current user location as incident location
    const handleUseMyCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser.");
            return;
        }

        setLoadingLocation(true);
        setLocationError("");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const coords = [lat, lng];

                const suburbName = await reverseGeocodeSuburb(lat, lng);

                setUserLocation(coords);
                setHasRealLocation(true);
                setLoadingLocation(false);

                setForm((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                    suburb: suburbName || prev.suburb,
                }));

                recenterMapTo(coords);

                setErrors((prev) => ({
                    ...prev,
                    location: "",
                    suburb: "",
                }));
            },
            (error) => {
                console.error("Use current location error:", error);
                setLoadingLocation(false);

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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
            location: "",
        }));

        setMessage("");
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.incident_type.trim()) {
            newErrors.incident_type = "Incident type is required";
        }

        if (!form.description.trim()) {
            newErrors.description = "Description is required";
        }

        if (!form.suburb.trim()) {
            newErrors.suburb = "Suburb is required";
        }

        if (!form.incident_time) {
            newErrors.incident_time = "Incident time is required";
        }

        if (form.latitude === "" || form.longitude === "") {
            newErrors.location = "Please select the incident location from the map";
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setMessage("");
            return;
        }

        try {
            const res = await api.post("/reports", {
                ...form,
                latitude: Number(form.latitude),
                longitude: Number(form.longitude),
            });

            setMessage(res.data.message || "Report submitted successfully");
            setErrors({});

            setForm({
                incident_type: "",
                description: "",
                suburb: "",
                latitude: "",
                longitude: "",
                incident_time: "",
                is_anonymous: false,
            });

            if (hasRealLocation) {
                recenterMapTo(userLocation);
            } else {
                recenterMapTo(defaultCenter);
            }
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to submit report");
        }
    };

    const selectedPosition =
        form.latitude !== "" && form.longitude !== ""
            ? [Number(form.latitude), Number(form.longitude)]
            : null;

    const distanceFromUser =
        hasRealLocation && selectedPosition
            ? calculateDistanceKm(
                userLocation[0],
                userLocation[1],
                selectedPosition[0],
                selectedPosition[1]
            )
            : null;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        Report an Incident
                    </h2>
                    <p className="text-slate-500">
                        Fill in the incident details and select the exact location from the
                        map.
                    </p>
                </div>

                {message && (
                    <div className="mb-6 rounded-lg bg-blue-100 text-blue-800 px-4 py-3">
                        {message}
                    </div>
                )}

                {locationError && (
                    <div className="mb-6 rounded-lg bg-amber-100 text-amber-800 px-4 py-3">
                        {locationError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block mb-2 font-medium">Incident Type</label>
                        <select
                            name="incident_type"
                            value={form.incident_type}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="">Select incident type</option>
                            <option value="Car Theft">Car Theft</option>
                            <option value="Assault">Assault</option>
                            <option value="Burglary">Burglary</option>
                            <option value="Vandalism">Vandalism</option>
                            <option value="Suspicious Activity">Suspicious Activity</option>
                        </select>
                        {errors.incident_type && (
                            <p className="text-red-500 text-sm mt-1">{errors.incident_type}</p>
                        )}
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe what happened"
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                        )}
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">Suburb</label>
                        <input
                            name="suburb"
                            value={form.suburb}
                            onChange={handleChange}
                            placeholder="Suburb will auto-fill when you select a location"
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        {errors.suburb && (
                            <p className="text-red-500 text-sm mt-1">{errors.suburb}</p>
                        )}
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">Incident Time</label>
                        <input
                            type="datetime-local"
                            name="incident_time"
                            value={form.incident_time}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        {errors.incident_time && (
                            <p className="text-red-500 text-sm mt-1">{errors.incident_time}</p>
                        )}
                    </div>

                    <div>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-2">
                            <label className="block font-medium">Select Incident Location</label>

                            <div className="flex gap-3 flex-wrap">
                                <button
                                    type="button"
                                    onClick={handleRecenterMap}
                                    className="btn-secondary"
                                >
                                    Recenter Map
                                </button>

                                <button
                                    type="button"
                                    onClick={handleUseMyCurrentLocation}
                                    className="btn-primary"
                                >
                                    {loadingLocation ? "Locating..." : "Use My Current Location"}
                                </button>
                            </div>
                        </div>

                        <div className="relative z-0 rounded-xl overflow-hidden border border-slate-300">
                            <MapContainer
                                center={defaultCenter}
                                zoom={13}
                                scrollWheelZoom={true}
                                className="h-[420px] md:h-[500px] w-full"
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
                                        <Marker position={userLocation} icon={userBlueDotIcon} />
                                    </>
                                )}

                                <LocationPicker
                                    setForm={setForm}
                                    selectedPosition={selectedPosition}
                                    setErrors={setErrors}
                                />
                            </MapContainer>
                        </div>

                        {selectedPosition && (
                            <p className="text-sm text-slate-600 mt-2">
                                Selected coordinates: {Number(form.latitude).toFixed(6)},{" "}
                                {Number(form.longitude).toFixed(6)}
                            </p>
                        )}

                        {distanceFromUser !== null && (
                            <p className="text-sm text-slate-600 mt-1">
                                Distance from your current location:{" "}
                                {distanceFromUser.toFixed(2)} km
                            </p>
                        )}

                        {errors.location && (
                            <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="is_anonymous"
                            checked={form.is_anonymous}
                            onChange={handleChange}
                            className="h-4 w-4"
                        />
                        <label className="font-medium">Submit anonymously</label>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition"
                    >
                        Submit Report
                    </button>
                </form>
            </div>
        </div>
    );
}