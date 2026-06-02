# Nearby Push Notification Backend Setup

SafeVic sends Firebase Cloud Messaging (FCM) notifications to registered Android
devices whose last saved location is near a newly reported incident.

## Firebase Credentials

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Open **Project settings > Service accounts** and generate a new private key.
3. Download the service account JSON from Firebase Console and save it locally as:

   ```text
   backend/firebase-service-account.json
   ```

   This credential is secret and must not be committed to git.

4. Copy `backend/.env.example` to `backend/.env`, configure the database and JWT
   values, and keep these notification settings:

   ```dotenv
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   NOTIFICATION_RADIUS_KM=5
   ```

`NOTIFICATION_RADIUS_KM` controls how close a registered device must be to a
new incident before it receives a notification.

## Database And Backend

For a fresh development database, run the project schema from the repository
root:

```bash
psql -U postgres -d safevic_db -f backend/src/models/schema.sql
```

The existing schema script drops and recreates application tables. For a
database whose users or reports must be retained, apply only the
`CREATE TABLE IF NOT EXISTS push_tokens (...)` statement from that file rather
than running the reset script.

The schema creates the `push_tokens` table used to store each authenticated
user's FCM token and last known device location.

Install and start the backend:

```bash
cd backend
npm install firebase-admin
npm run dev
```

## Verification

1. Configure and run the Android app with its Firebase `google-services.json`.
2. Log in on an Android device and grant notification and location permissions.
3. Confirm that the device has a row in `push_tokens`.
4. Log in on a second Android device near the first device, so it also stores a
   nearby token and location.
5. Create a report from one device near the other saved device location.
6. Confirm the other device receives **New incident reported nearby** and that
   tapping it opens the incident detail screen.

The device that submits a report is excluded from its notification recipients.
