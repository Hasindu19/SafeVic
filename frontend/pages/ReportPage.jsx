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

// Default center if browser location is not available
const defaultCenter = [-37.8136, 144.9631];

// Blue dot icon for user's current location
const userBlueDotIcon = L.divIcon({
    className: "custom-user-dot-wrapper",
    html: `<div class="custom-user-dot"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

// Normal marker icon for selected incident location
const selectedLocationIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Component to move map view when center changes
function RecenterMap({ center, zoom = 15 }) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.setView(center, zoom, { animate: true });
        }
    }, [center, zoom, map]);

    return null;
}

// Component to let user click map and select incident location
function LocationPicker({ setForm, selectedPosition }) {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;

            // Save clicked location into form
            setForm((prev) => ({
                ...prev,
                latitude: lat,
                longitude: lng,
            }));
        },
    });

    // Show marker if incident location is selected
    return selectedPosition ? (
        <Marker position={selectedPosition} icon={selectedLocationIcon} />
    ) : null;
}

export default function ReportPage() {
    // Form data
    const [form, setForm] = useState({
        incident_type: "",
        description: "",
        suburb: "",
        latitude: "",
        longitude: "",
        incident_time: "",
        is_anonymous: false,
    });

    // Validation errors
    const [errors, setErrors] = useState({});

    // Success or failure message
    const [message, setMessage] = useState("");

    // User's real current location (blue dot)
    const [userLocation, setUserLocation] = useState(defaultCenter);

    // Whether browser location was successfully found
    const [hasRealLocation, setHasRealLocation] = useState(false);

    // Loading state for GPS
    const [loadingLocation, setLoadingLocation] = useState(true);

    // Error if location access fails
    const [locationError, setLocationError] = useState("");

    // Actual map center position
    const [mapCenter, setMapCenter] = useState(defaultCenter);

    // Get user location when page loads
    useEffect(() => {
        getUserLocation(true);
    }, []);

    // Get user location from browser
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

                // Save user's location for blue dot
                setUserLocation(coords);
                setHasRealLocation(true);
                setLoadingLocation(false);

                // Move map there if needed
                if (autoCenter) {
                    setMapCenter([...coords]);
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

    // Button 1:
    // Only move the map view back to user's current location
    // This does NOT change form latitude/longitude
    const handleRecenterMap = () => {
        if (hasRealLocation) {
            setMapCenter([...userLocation]);
        }
    };

    // Button 2:
    // Use current browser location as incident location
    // This updates form latitude/longitude and centers map
    const handleUseMyCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser.");
            return;
        }

        setLoadingLocation(true);
        setLocationError("");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const coords = [lat, lng];

                // Update user blue dot location
                setUserLocation(coords);
                setHasRealLocation(true);
                setLoadingLocation(false);

                // Save current location into form as incident location
                setForm((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                }));

                // Center map to this location
                setMapCenter([...coords]);

                // Clear location error if any
                setErrors((prev) => ({
                    ...prev,
                    location: "",
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

    // Handle text/select/checkbox changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        // Clear field errors when typing
        setErrors((prev) => ({
            ...prev,
            [name]: "",
            location: "",
        }));

        setMessage("");
    };

    // Frontend validation
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

    // Submit form to backend
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

            // Reset form after success
            setForm({
                incident_type: "",
                description: "",
                suburb: "",
                latitude: "",
                longitude: "",
                incident_time: "",
                is_anonymous: false,
            });

            // Recenter map to user location after submit
            if (hasRealLocation) {
                setMapCenter([...userLocation]);
            } else {
                setMapCenter([...defaultCenter]);
            }
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to submit report");
        }
    };

    // Selected incident position for marker
    const selectedPosition =
        form.latitude !== "" && form.longitude !== ""
            ? [Number(form.latitude), Number(form.longitude)]
            : null;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
                {/* Page heading */}
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        Report an Incident
                    </h2>
                    <p className="text-slate-500">
                        Fill in the incident details and select the exact location from the
                        map.
                    </p>
                </div>

                {/* Success or failure message */}
                {message && (
                    <div className="mb-6 rounded-lg bg-blue-100 text-blue-800 px-4 py-3">
                        {message}
                    </div>
                )}

                {/* Browser location errors */}
                {locationError && (
                    <div className="mb-6 rounded-lg bg-amber-100 text-amber-800 px-4 py-3">
                        {locationError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Incident type */}
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

                    {/* Description */}
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

                    {/* Suburb */}
                    <div>
                        <label className="block mb-2 font-medium">Suburb</label>
                        <input
                            name="suburb"
                            value={form.suburb}
                            onChange={handleChange}
                            placeholder="e.g. Melbourne"
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        {errors.suburb && (
                            <p className="text-red-500 text-sm mt-1">{errors.suburb}</p>
                        )}
                    </div>

                    {/* Incident time */}
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

                    {/* Map section */}
                    <div>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-2">
                            <label className="block font-medium">Select Incident Location</label>

                            <div className="flex gap-3 flex-wrap">
                                {/* Button 1: only recenter map */}
                                <button
                                    type="button"
                                    onClick={handleRecenterMap}
                                    className="inline-flex items-center justify-center rounded-xl bg-slate-700 px-4 py-2 text-white font-medium shadow hover:bg-slate-800 transition"
                                >
                                    Recenter Map
                                </button>

                                {/* Button 2: use user current location as incident location */}
                                <button
                                    type="button"
                                    onClick={handleUseMyCurrentLocation}
                                    className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-4 py-2 text-white font-medium shadow hover:bg-cyan-700 transition"
                                >
                                    {loadingLocation ? "Locating..." : "Use My Current Location"}
                                </button>
                            </div>
                        </div>

                        {/* Leaflet map */}
                        <div className="rounded-xl overflow-hidden border border-slate-300">
                            <MapContainer
                                center={mapCenter}
                                zoom={13}
                                scrollWheelZoom={true}
                                style={{ height: "350px", width: "100%" }}
                            >
                                <TileLayer
                                    attribution="&copy; OpenStreetMap contributors"
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                {/* Recenter helper */}
                                <RecenterMap center={mapCenter} zoom={15} />

                                {/* Show user's current location as blue dot */}
                                {hasRealLocation && (
                                    <>
                                        <Marker position={userLocation} icon={userBlueDotIcon} />
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

                                {/* Let user pick incident location by clicking */}
                                <LocationPicker
                                    setForm={setForm}
                                    selectedPosition={selectedPosition}
                                />
                            </MapContainer>
                        </div>

                        {/* Show selected coordinates */}
                        {selectedPosition && (
                            <p className="text-sm text-slate-600 mt-2">
                                Selected coordinates: {Number(form.latitude).toFixed(6)},{" "}
                                {Number(form.longitude).toFixed(6)}
                            </p>
                        )}

                        {/* Validation error for map location */}
                        {errors.location && (
                            <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                        )}
                    </div>

                    {/* Anonymous checkbox */}
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

                    {/* Submit button */}
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