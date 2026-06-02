const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (admin.apps.length === 0 && serviceAccountPath) {
    try {
        const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
        const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error) {
        console.error("FIREBASE INITIALIZATION ERROR:", error.message);
    }
}

module.exports = admin;
