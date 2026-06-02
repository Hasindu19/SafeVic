const pool = require("../config/db");
const admin = require("../config/firebase");

const INVALID_TOKEN_ERRORS = new Set([
    "messaging/invalid-registration-token",
    "messaging/registration-token-not-registered",
]);

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const earthRadiusKm = 6371;
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const latitudeDelta = toRadians(lat2 - lat1);
    const longitudeDelta = toRadians(lon2 - lon1);

    const a =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(longitudeDelta / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getNearbyPushTokens = async (latitude, longitude, radiusKm, excludeUserId) => {
    const result = await pool.query(
        `SELECT pt.token, pt.latitude, pt.longitude,
                COALESCE(uap.radius_km, $2) AS radius_km
         FROM push_tokens pt
         LEFT JOIN user_alert_preferences uap ON uap.user_id = pt.user_id
         WHERE pt.latitude IS NOT NULL
           AND pt.longitude IS NOT NULL
           AND pt.user_id IS DISTINCT FROM $1
           AND COALESCE(uap.alerts_enabled, true) = true`,
        [excludeUserId, radiusKm]
    );

    return result.rows
        .filter((device) => {
            const distance = calculateDistanceKm(
                latitude,
                longitude,
                Number(device.latitude),
                Number(device.longitude)
            );

            return distance <= Number(device.radius_km);
        })
        .map((device) => device.token);
};

const sendNearbyIncidentNotification = async (report) => {
    if (admin.apps.length === 0) {
        console.warn("Nearby incident notification skipped: Firebase is not configured.");
        return;
    }

    const latitude = Number(report.latitude);
    const longitude = Number(report.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        console.warn("Nearby incident notification skipped: report has invalid coordinates.");
        return;
    }

    const configuredRadius = Number(process.env.NOTIFICATION_RADIUS_KM || 5);
    const radiusKm =
        Number.isFinite(configuredRadius) && configuredRadius >= 0 ? configuredRadius : 5;
    const tokens = await getNearbyPushTokens(latitude, longitude, radiusKm, report.user_id);

    if (tokens.length === 0) {
        return;
    }

    let successCount = 0;
    let failureCount = 0;
    const invalidTokens = [];

    for (let index = 0; index < tokens.length; index += 500) {
        const tokenBatch = tokens.slice(index, index + 500);
        const response = await admin.messaging().sendEachForMulticast({
            tokens: tokenBatch,
            notification: {
                title: "New incident reported nearby",
                body: `${report.incident_type} reported in ${report.suburb}`,
            },
            data: {
                reportId: String(report.id),
                incidentType: String(report.incident_type),
                suburb: String(report.suburb),
            },
        });

        successCount += response.successCount;
        failureCount += response.failureCount;

        response.responses.forEach((sendResult, responseIndex) => {
            if (!sendResult.success && INVALID_TOKEN_ERRORS.has(sendResult.error?.code)) {
                invalidTokens.push(tokenBatch[responseIndex]);
            }
        });
    }

    if (invalidTokens.length > 0) {
        await pool.query("DELETE FROM push_tokens WHERE token = ANY($1::text[])", [invalidTokens]);
    }

    console.log(
        `Nearby incident notifications sent: ${successCount} successful, ${failureCount} failed.`
    );
};

module.exports = {
    calculateDistanceKm,
    getNearbyPushTokens,
    sendNearbyIncidentNotification,
};
