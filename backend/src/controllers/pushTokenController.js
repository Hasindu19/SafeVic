const pool = require("../config/db");

const toNullableCoordinate = (value, min, max) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const coordinate = Number(value);

    if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
        return undefined;
    }

    return coordinate;
};

const savePushToken = async (req, res) => {
    try {
        const { token, latitude, longitude, platform = "android" } = req.body;
        const userId = req.user.id;

        if (!token || typeof token !== "string" || !token.trim()) {
            return res.status(400).json({ message: "Push notification token is required" });
        }

        const lat = toNullableCoordinate(latitude, -90, 90);
        const lng = toNullableCoordinate(longitude, -180, 180);

        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ message: "Invalid device location coordinates" });
        }

        const result = await pool.query(
            `INSERT INTO push_tokens (user_id, token, latitude, longitude, platform)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (token)
             DO UPDATE SET
                 user_id = EXCLUDED.user_id,
                 latitude = EXCLUDED.latitude,
                 longitude = EXCLUDED.longitude,
                 platform = EXCLUDED.platform,
                 updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [userId, token.trim(), lat, lng, platform || "android"]
        );

        res.json({
            message: "Push notification token saved successfully",
            pushToken: result.rows[0],
        });
    } catch (error) {
        console.error("SAVE PUSH TOKEN ERROR:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    savePushToken,
};
