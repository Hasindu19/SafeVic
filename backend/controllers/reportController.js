const pool = require("../config/db");

const createReport = async (req, res) => {
    try {
        console.log("Incoming body:", req.body);

        const {
            incident_type,
            description,
            suburb,
            latitude,
            longitude,
            incident_time,
            is_anonymous,
        } = req.body;

        const result = await pool.query(
            `INSERT INTO reports 
       (incident_type, description, suburb, latitude, longitude, incident_time, is_anonymous)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [
                incident_type,
                description,
                suburb,
                latitude,
                longitude,
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
            detail: error.detail || null,
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
            detail: error.detail || null,
        });
    }
};

module.exports = {
    createReport,
    getReports,
};