const pool = require("../config/db");
const { sendNearbyIncidentNotification } = require("../services/notificationService");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

const ALLOWED_SEVERITIES = ["low", "medium", "high", "critical"];

const parseBoolean = (value) => value === true || value === "true";

const uploadReportImage = async (file) => {
    if (!file) {
        return null;
    }

    if (!isCloudinaryConfigured) {
        const error = new Error("Image uploads are not configured on this server");
        error.statusCode = 503;
        throw error;
    }

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "safevic/reports", resource_type: "image" },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(result.secure_url);
            }
        );

        uploadStream.end(file.buffer);
    });
};

const createReport = async (req, res) => {
    let client;

    try {
        const {
            incident_type,
            description,
            suburb,
            latitude,
            longitude,
            incident_time,
            is_anonymous,
            severity = "medium",
        } = req.body;

        const user_id = req.user.id; // comes from JWT middleware

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
                message: "Latitude must be between -90 and 90",
            });
        }

        if (Number.isNaN(lng) || lng < -180 || lng > 180) {
            return res.status(400).json({
                message: "Longitude must be between -180 and 180",
            });
        }

        if (Number.isNaN(date.getTime())) {
            return res.status(400).json({
                message: "Incident time must be valid",
            });
        }

        if (!ALLOWED_SEVERITIES.includes(severity)) {
            return res.status(400).json({
                message: "Severity must be low, medium, high, or critical",
            });
        }

        const imageUrl = await uploadReportImage(req.file);

        client = await pool.connect();
        await client.query("BEGIN");

        const result = await client.query(
            `INSERT INTO reports
       (incident_type, description, suburb, latitude, longitude, incident_time, is_anonymous, user_id, severity, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
            [
                incident_type.trim(),
                description.trim(),
                suburb.trim(),
                lat,
                lng,
                incident_time,
                parseBoolean(is_anonymous),
                user_id,
                severity,
                imageUrl,
            ]
        );

        const report = result.rows[0];

        await client.query(
            `INSERT INTO report_status_history (report_id, old_status, new_status, changed_by)
             VALUES ($1, $2, $3, $4)`,
            [report.id, null, report.status, user_id]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Report created successfully",
            report,
        });

        try {
            sendNearbyIncidentNotification(report).catch((error) => {
                console.error("SEND NEARBY NOTIFICATION ERROR:", error);
            });
        } catch (error) {
            console.error("SEND NEARBY NOTIFICATION ERROR:", error);
        }
    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => {});
        }

        console.error("CREATE REPORT ERROR:", error);
        res.status(error.statusCode || 500).json({
            message: "Server error",
            error: error.message,
        });
    } finally {
        if (client) {
            client.release();
        }
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

const getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "SELECT * FROM reports WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Report not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("GET REPORT BY ID ERROR:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

const getMyReports = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            "SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("GET MY REPORTS ERROR:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

const updateReportStatus = async (req, res) => {
    let client;

    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ["pending", "under_review", "resolved"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status value",
            });
        }

        client = await pool.connect();
        await client.query("BEGIN");

        const currentResult = await client.query(
            "SELECT status FROM reports WHERE id = $1 FOR UPDATE",
            [id]
        );

        if (currentResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                message: "Report not found",
            });
        }

        const oldStatus = currentResult.rows[0].status;
        const result = await client.query(
            "UPDATE reports SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );

        if (oldStatus !== status) {
            await client.query(
                `INSERT INTO report_status_history (report_id, old_status, new_status, changed_by)
                 VALUES ($1, $2, $3, $4)`,
                [id, oldStatus, status, req.user.id]
            );
        }

        await client.query("COMMIT");

        res.json({
            message: "Status updated successfully",
            report: result.rows[0],
        });
    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => {});
        }

        console.error("UPDATE STATUS ERROR:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    } finally {
        if (client) {
            client.release();
        }
    }
};

const getReportStatusHistory = async (req, res) => {
    try {
        const reportResult = await pool.query(
            "SELECT user_id FROM reports WHERE id = $1",
            [req.params.id]
        );

        if (reportResult.rows.length === 0) {
            return res.status(404).json({ message: "Report not found" });
        }

        const mayViewHistory =
            ["council", "police_admin"].includes(req.user.role) ||
            reportResult.rows[0].user_id === req.user.id;

        if (!mayViewHistory) {
            return res.status(403).json({ message: "Access denied" });
        }

        const history = await pool.query(
            `SELECT id, report_id, old_status, new_status, changed_by, created_at
             FROM report_status_history
             WHERE report_id = $1
             ORDER BY created_at ASC`,
            [req.params.id]
        );

        res.json(history.rows);
    } catch (error) {
        console.error("GET STATUS HISTORY ERROR:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

module.exports = {
    createReport,
    getReports,
    getReportById,
    getMyReports,
    updateReportStatus,
    getReportStatusHistory,
};
