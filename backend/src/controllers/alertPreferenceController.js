const pool = require("../config/db");

const ALLOWED_RADII = [1, 3, 5, 10, 20];

const getMyAlertPreferences = async (req, res) => {
    try {
        const result = await pool.query(
            `INSERT INTO user_alert_preferences (user_id)
             VALUES ($1)
             ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
             RETURNING *`,
            [req.user.id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("GET ALERT PREFERENCES ERROR:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updateMyAlertPreferences = async (req, res) => {
    try {
        const radiusKm = Number(req.body.radius_km);
        const alertsEnabled = req.body.alerts_enabled;

        if (!ALLOWED_RADII.includes(radiusKm) || typeof alertsEnabled !== "boolean") {
            return res.status(400).json({
                message: "Select a valid alert radius and enabled preference",
            });
        }

        const result = await pool.query(
            `INSERT INTO user_alert_preferences (user_id, radius_km, alerts_enabled)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id)
             DO UPDATE SET
                 radius_km = EXCLUDED.radius_km,
                 alerts_enabled = EXCLUDED.alerts_enabled,
                 updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [req.user.id, radiusKm, alertsEnabled]
        );

        res.json({
            message: "Alert preferences saved successfully",
            preferences: result.rows[0],
        });
    } catch (error) {
        console.error("UPDATE ALERT PREFERENCES ERROR:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    getMyAlertPreferences,
    updateMyAlertPreferences,
};
