const express = require("express");
const cors = require("cors");

const reportRoutes = require("./src/routes/reportRoutes");
const authRoutes = require("./src/routes/authRoutes");

const { protect, authorize } = require("./src/middleware/authMiddleware");


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/reports", reportRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("SafeVic API is running...");
});

app.get(
    "/api/protected/dashboard-access",
    protect,
    authorize("council", "police_admin"),
    (req, res) => {
        res.json({
            message: "You can access dashboard",
            user: req.user,
        });
    }
);

module.exports = app;