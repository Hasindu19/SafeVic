import { useCallback, useEffect, useState } from "react";
import api from "../services/api.js";
import {
    getCurrentLocation,
    getLocationErrorMessage,
} from "../services/location.js";
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

const selectedLocationIcon = L.divIcon({
    className: "selected-incident-marker-wrapper",
    html: `
        <div class="selected-incident-marker">
            <span class="selected-incident-marker-dot"></span>
        </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { signal: controller.signal }
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
    } finally {
        clearTimeout(timeoutId);
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

const CATEGORY_KEYWORDS = [
    { category: "Car Theft", keywords: ["car", "vehicle", "plate", "stolen", "parked"] },
    { category: "Assault", keywords: ["fight", "assault", "attack", "punched"] },
    { category: "Burglary", keywords: ["break in", "house", "door", "window"] },
    { category: "Vandalism", keywords: ["graffiti", "damage", "smashed"] },
    { category: "Suspicious Activity", keywords: ["suspicious", "following", "unknown person"] },
];

// Click map to choose incident location
function LocationPicker({ setForm, selectedPosition, setErrors }) {
    useMapEvents({
        async click(e) {
            const { lat, lng } = e.latlng;

            setForm((prev) => ({
                ...prev,
                latitude: lat,
                longitude: lng,
            }));

            setErrors((prev) => ({
                ...prev,
                location: "",
            }));

            const suburbName = await reverseGeocodeSuburb(lat, lng);

            if (!suburbName) {
                return;
            }

            setForm((prev) => ({
                ...prev,
                suburb: suburbName,
            }));

            setErrors((prev) => ({
                ...prev,
                suburb: "",
            }));
        },
    });

    return selectedPosition ? (
        <>
            <Circle
                center={selectedPosition}
                radius={45}
                pathOptions={{
                    color: "#0891b2",
                    fillColor: "#22d3ee",
                    fillOpacity: 0.2,
                    weight: 2,
                }}
            />
            <Marker position={selectedPosition} icon={selectedLocationIcon} />
        </>
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
        severity: "medium",
    });

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [categorySuggestion, setCategorySuggestion] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [imageInputKey, setImageInputKey] = useState(0);

    const [userLocation, setUserLocation] = useState(defaultCenter);
    const [hasRealLocation, setHasRealLocation] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [locationError, setLocationError] = useState("");

    const [recenterTarget, setRecenterTarget] = useState(defaultCenter);
    const [recenterKey, setRecenterKey] = useState(0);

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

    useEffect(() => {
        getUserLocation(true);
    }, [getUserLocation]);

    useEffect(() => {
        if (!image) return undefined;

        const reader = new FileReader();
        const handleLoad = () => setImagePreview(String(reader.result || ""));

        reader.addEventListener("load", handleLoad);
        reader.readAsDataURL(image);

        return () => reader.removeEventListener("load", handleLoad);
    }, [image]);

    // Only move map back to current user location
    const handleRecenterMap = () => {
        if (hasRealLocation) {
            recenterMapTo(userLocation);
        }
    };

    // Use current user location as incident location
    const handleUseMyCurrentLocation = async () => {
        setLoadingLocation(true);
        setLocationError("");

        try {
            const { coords } = await getCurrentLocation({
                highAccuracy: false,
                timeout: 5000,
                maximumAge: 60000,
            });
            const [lat, lng] = coords;

            setUserLocation(coords);
            setHasRealLocation(true);
            setLoadingLocation(false);

            setForm((prev) => ({
                ...prev,
                latitude: lat,
                longitude: lng,
            }));

            recenterMapTo(coords);

            setErrors((prev) => ({
                ...prev,
                location: "",
            }));

            const suburbName = await reverseGeocodeSuburb(lat, lng);

            if (suburbName) {
                setForm((prev) => ({
                    ...prev,
                    suburb: suburbName,
                }));

                setErrors((prev) => ({
                    ...prev,
                    suburb: "",
                }));
            }
        } catch (error) {
            console.error("Use current location error:", error);
            setLoadingLocation(false);
            setLocationError(getLocationErrorMessage(error));
        }
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
        setSubmitted(false);

        if (name === "description") {
            setCategorySuggestion("");
        }
    };

    const handleSuggestCategory = () => {
        const description = form.description.toLowerCase();
        const match = CATEGORY_KEYWORDS.find(({ keywords }) =>
            keywords.some((keyword) => description.includes(keyword))
        );

        if (!match) {
            setCategorySuggestion("No keyword match found. Please choose the most appropriate category.");
            return;
        }

        setForm((current) => ({ ...current, incident_type: match.category }));
        setErrors((current) => ({ ...current, incident_type: "" }));
        setCategorySuggestion(
            `Suggested category: ${match.category}. Suggested from description keywords. Please confirm before submitting.`
        );
    };

    const handleImageChange = (event) => {
        const selectedImage = event.target.files?.[0] || null;
        setImage(selectedImage);
        if (!selectedImage) setImagePreview("");
        setMessage("");
        setSubmitted(false);
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

    const scrollToTop = () => {
        window.requestAnimationFrame(() => {
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setMessage("");
            setSubmitted(false);
            scrollToTop();
            return;
        }

        try {
            const payload = {
                ...form,
                latitude: Number(form.latitude),
                longitude: Number(form.longitude),
            };
            let requestBody = payload;

            if (image) {
                requestBody = new FormData();

                Object.entries(payload).forEach(([key, value]) => {
                    requestBody.append(key, String(value));
                });

                requestBody.append("image", image);
            }

            const res = await api.post("/reports", requestBody);

            setMessage(res.data.message || "Report submitted successfully");
            setSubmitted(true);
            setErrors({});

            setForm({
                incident_type: "",
                description: "",
                suburb: "",
                latitude: "",
                longitude: "",
                incident_time: "",
                is_anonymous: false,
                severity: "medium",
            });
            setCategorySuggestion("");
            setImage(null);
            setImageInputKey((current) => current + 1);

            if (hasRealLocation) {
                recenterMapTo(userLocation);
            } else {
                recenterMapTo(defaultCenter);
            }

            scrollToTop();
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to submit report");
            setSubmitted(false);
            scrollToTop();
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
        <div className="mx-auto w-full max-w-3xl">
            <div className="card p-4 sm:p-6 md:p-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2 md:text-3xl">
                        Report an Incident
                    </h2>
                    <p className="text-slate-500">
                        Fill in the incident details and select the exact location from the
                        map.
                    </p>
                </div>

                {message && (
                    <div className={`mb-6 rounded-xl border px-4 py-3 ${submitted ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
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
                        <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                onClick={handleSuggestCategory}
                                className="btn-secondary px-4 py-2 text-sm"
                            >
                                Suggest Category
                            </button>
                            {categorySuggestion && (
                                <p className="text-sm text-cyan-700">{categorySuggestion}</p>
                            )}
                        </div>
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                        )}
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">Severity</label>
                        <select
                            name="severity"
                            value={form.severity}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
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
                        <label className="block mb-2 font-medium">Photo Evidence (optional)</label>
                        <input
                            key={imageInputKey}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
                        />
                        <p className="mt-2 text-sm text-slate-500">Upload one image, up to 5 MB.</p>
                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Selected incident preview"
                                className="mt-4 h-48 w-full rounded-xl object-cover sm:w-72"
                            />
                        )}
                    </div>

                    <div>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-2">
                            <label className="block font-medium">Select Incident Location</label>

                            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap md:w-auto">
                                <button
                                    type="button"
                                    onClick={handleRecenterMap}
                                    className="btn-secondary w-full sm:w-auto"
                                    aria-label="Recenter the incident map"
                                    title="Recenter map"
                                >
                                    Recenter Map
                                </button>

                                <button
                                    type="button"
                                    onClick={handleUseMyCurrentLocation}
                                    className="btn-primary w-full sm:w-auto"
                                    aria-label="Use my current location as the incident location"
                                    title="Use my current location"
                                >
                                    {loadingLocation ? "Locating..." : "Use My Current Location"}
                                </button>
                            </div>
                        </div>

                        <div className="mb-4 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
                            <span className="font-semibold">Location tip:</span>{" "}
                            Tap on the map to choose the exact incident location.
                        </div>

                        <div className="relative z-0 rounded-xl overflow-hidden border border-slate-300">
                            <MapContainer
                                center={defaultCenter}
                                zoom={13}
                                scrollWheelZoom={true}
                                touchZoom={true}
                                dragging={true}
                                tap={true}
                                className="h-[360px] md:h-[500px] w-full"
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
                        className="btn-primary w-full"
                    >
                        Submit Report
                    </button>
                </form>
            </div>
        </div>
    );
}
