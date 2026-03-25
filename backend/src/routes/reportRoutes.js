const express = require("express");
const router = express.Router();

const {
    createReport,
    getReports,
    getReportById,
    getMyReports,
} = require("../controllers/reportController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createReport);
router.get("/mine", protect, getMyReports);
router.get("/", getReports);
router.get("/:id", getReportById);

module.exports = router;