const express = require("express");
const multer = require("multer");
const router = express.Router();

const {
    createReport,
    getReports,
    getReportById,
    getMyReports,
    updateReportStatus,
    getReportStatusHistory,
} = require("../controllers/reportController");

const { protect, authorize } = require("../middleware/authMiddleware");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith("image/")) {
            callback(new Error("Only image uploads are supported"));
            return;
        }

        callback(null, true);
    },
});

router.post("/", protect, upload.single("image"), createReport);
router.get("/mine", protect, getMyReports);
router.get("/", getReports);
router.get("/:id/status-history", protect, getReportStatusHistory);
router.get("/:id", getReportById);
router.put(
    "/:id/status",
    protect,
    authorize("police_admin"),
    updateReportStatus
);

module.exports = router;
