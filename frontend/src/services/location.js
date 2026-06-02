import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

const isAndroid = Capacitor.getPlatform() === "android";

const toCoords = (position) => [
    position.coords.latitude,
    position.coords.longitude,
];

const getLocationErrorMessage = (error, fallback = "Could not get your current location.") => {
    if (error?.code === 1 || error?.message?.toLowerCase().includes("denied")) {
        return "Location access was denied.";
    }

    if (error?.code === 2) {
        return "Unable to detect your location.";
    }

    if (error?.code === 3 || error?.message?.toLowerCase().includes("timeout")) {
        return "Location request timed out.";
    }

    return fallback;
};

const ensureAndroidLocationPermission = async () => {
    const permission = await Geolocation.checkPermissions();

    if (permission.location === "granted" || permission.coarseLocation === "granted") {
        return;
    }

    const requested = await Geolocation.requestPermissions();

    if (requested.location !== "granted" && requested.coarseLocation !== "granted") {
        throw new Error("Location access was denied.");
    }
};

export const getCurrentLocation = async ({
    highAccuracy = false,
    timeout = 5000,
    maximumAge = 60000,
} = {}) => {
    if (isAndroid) {
        await ensureAndroidLocationPermission();

        const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: highAccuracy,
            timeout,
            maximumAge,
        });

        return {
            coords: toCoords(position),
            position,
        };
    }

    if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser.");
    }

    const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: highAccuracy,
            timeout,
            maximumAge,
        });
    });

    return {
        coords: toCoords(position),
        position,
    };
};

export const watchCurrentLocation = async (
    onLocation,
    onError,
    {
        highAccuracy = true,
        timeout = 8000,
        maximumAge = 5000,
    } = {}
) => {
    if (isAndroid) {
        await ensureAndroidLocationPermission();

        return Geolocation.watchPosition(
            {
                enableHighAccuracy: highAccuracy,
                timeout,
                maximumAge,
            },
            (position, error) => {
                if (error) {
                    onError(error);
                    return;
                }

                if (position) {
                    onLocation({
                        coords: toCoords(position),
                        position,
                    });
                }
            }
        );
    }

    if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser.");
    }

    return navigator.geolocation.watchPosition(
        (position) => {
            onLocation({
                coords: toCoords(position),
                position,
            });
        },
        onError,
        {
            enableHighAccuracy: highAccuracy,
            timeout,
            maximumAge,
        }
    );
};

export const clearLocationWatch = async (watchId) => {
    if (watchId === null || watchId === undefined) {
        return;
    }

    if (isAndroid) {
        await Geolocation.clearWatch({ id: watchId });
        return;
    }

    navigator.geolocation.clearWatch(watchId);
};

export { getLocationErrorMessage };
