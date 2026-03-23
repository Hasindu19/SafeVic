const pool = require("../config/db");

const createReport = async (req, res) => {
    try {
        const {
            incident_type,
            description,
            suburb,
            latitude,
            longitude,
            incident_time,
            is_anonymous,
        } = req.body;

        if (
            !incident_type ||
            !description ||
            !suburb ||
            latitude === undefined ||
            longitude === undefined ||
            !incident_time
        ) {
            return res.status(400).json({
                message: "All required fields must be provided",
            });
        }

        const lat = Number(latitude);
        const lng = Number(longitude);
        const date = new Date(incident_time);

        if (Number.isNaN(lat) || lat < -90 || lat > 90) {
            return res.status(400).json({
                message: "Latitude must be a valid number between -90 and 90",
            });
        }

        if (Number.isNaN(lng) || lng < -180 || lng > 180) {
            return res.status(400).json({
                message: "Longitude must be a valid number between -180 and 180",
            });
        }

        if (Number.isNaN(date.getTime())) {
            return res.status(400).json({
                message: "Incident time must be a valid date/time",
            });
        }

        const result = await pool.query(
            `INSERT INTO reports 
       (incident_type, description, suburb, latitude, longitude, incident_time, is_anonymous)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [
                incident_type.trim(),
                description.trim(),
                suburb.trim(),
                lat,
                lng,
                incident_time,
                is_anonymous ?? false,
            ]
        );

        res.status(201).json({
            message: "Report created successfully",
            report: result.rows[0],
        });
    } catch (error) {
        console.error("CREATE REPORT ERROR:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

const getReports = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM reports ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (error) {
        console.error("GET REPORTS ERROR:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

module.exports = {
    createReport,
    getReports,
};