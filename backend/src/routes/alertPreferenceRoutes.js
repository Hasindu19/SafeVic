const express = require("express");
const {
    getMyAlertPreferences,
    updateMyAlertPreferences,
} = require("../controllers/alertPreferenceController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, getMyAlertPreferences);
router.put("/me", protect, updateMyAlertPreferences);

module.exports = router;
