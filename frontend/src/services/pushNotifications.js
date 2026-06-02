import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import api from "./api.js";

let listenersRegistered = false;
export const PENDING_REPORT_ID_KEY = "safevic_pending_report_id";
export const NOTIFICATION_REPORT_EVENT = "safevic:notification-report";
const ANDROID_FIREBASE_CONFIGURED = import.meta.env.VITE_ANDROID_FIREBASE_CONFIGURED === "true";

const getCurrentCoordinates = () =>
    new Promise((resolve) => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            resolve({ latitude: null, longitude: null });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            () => {
                resolve({ latitude: null, longitude: null });
            },
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 60000,
            }
        );
    });

const saveRegisteredToken = async (token) => {
    const authToken = localStorage.getItem("safevic_token");

    if (!authToken) {
        return;
    }

    const { latitude, longitude } = await getCurrentCoordinates();

    await api.post(
        "/push-tokens",
        {
            token,
            latitude,
            longitude,
            platform: "android",
        },
        {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        }
    );
};

const addPushListeners = () => {
    if (listenersRegistered) {
        return;
    }

    PushNotifications.addListener("registration", async (token) => {
        console.log("Push registration token:", token.value);

        try {
            await saveRegisteredToken(token.value);
        } catch (error) {
            console.error("Unable to save push registration token:", error);
        }
    });

    PushNotifications.addListener("registrationError", (error) => {
        console.error("Push registration error:", error);
    });

    PushNotifications.addListener("pushNotificationReceived", (notification) => {
        console.log("Push notification received:", notification);
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
        console.log("Push notification action performed:", action);

        const reportId = action.notification?.data?.reportId;

        if (reportId) {
            localStorage.setItem(PENDING_REPORT_ID_KEY, String(reportId));
            window.dispatchEvent(
                new CustomEvent(NOTIFICATION_REPORT_EVENT, {
                    detail: { reportId: String(reportId) },
                })
            );
        }
    });

    listenersRegistered = true;
};

export const registerPushNotifications = async () => {
    if (Capacitor.getPlatform() === "web") {
        return;
    }

    if (Capacitor.getPlatform() === "android" && !ANDROID_FIREBASE_CONFIGURED) {
        console.warn("Push registration skipped: Firebase Android configuration is unavailable.");
        return;
    }

    try {
        addPushListeners();

        const permission = await PushNotifications.requestPermissions();

        if (permission.receive === "granted") {
            await PushNotifications.register();
        } else {
            console.log("Push notification permission not granted.");
        }
    } catch (error) {
        console.error("Unable to register for push notifications:", error);
    }
};
