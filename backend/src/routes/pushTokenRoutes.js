const express = require("express");
const { savePushToken } = require("../controllers/pushTokenController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, savePushToken);

module.exports = router;
