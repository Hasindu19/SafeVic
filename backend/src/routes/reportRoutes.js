const express = require("express");
const router = express.Router();

const {
    createReport,
    getReports,
    getReportById,
    getMyReports, updateReportStatus,
} = require("../controllers/reportController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, createReport);
router.get("/mine", protect, getMyReports);
router.get("/", getReports);
router.get("/:id", getReportById);
router.put(
    "/:id/status",
    protect,
    authorize("police_admin"),
    updateReportStatus
);

module.exports = router;