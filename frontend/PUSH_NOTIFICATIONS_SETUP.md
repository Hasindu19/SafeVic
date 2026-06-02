# SafeVic Push Notifications Setup

SafeVic uses the Capacitor Push Notifications plugin on Android. Android push notifications are delivered through Firebase Cloud Messaging (FCM).

After login, the app registers the device and sends its FCM token and available
device location to the backend. The backend uses these registrations for
nearby incident notifications.

## Firebase Setup

1. Create a Firebase project in the Firebase Console.
2. Add an Android app to the Firebase project.
3. Use this Android package name:

   ```text
   com.safevic.app
   ```

4. Download the generated `google-services.json` file.
5. Place it here:

   ```text
   frontend/android/app/google-services.json
   ```

Do not commit `google-services.json`. It contains Firebase project configuration and is ignored by git.

6. Enable native push registration in `frontend/.env` only after that file is present:

   ```dotenv
   VITE_ANDROID_FIREBASE_CONFIGURED=true
   ```

Without Firebase configuration, leave this value `false`; SafeVic will open
normally with push registration disabled.

## Build And Sync

From `frontend`:

```bash
npm run build
npx cap sync android
```

Then run the app on a real Android device from Android Studio or with Capacitor/ADB.

## Verify Registration

1. Open the Android app.
2. Log in.
3. Accept the notification permission prompt if shown.
4. Check Android Studio Logcat or the browser console attached to the WebView.
5. Look for:

   ```text
   Push registration token:
   ```

That token is the device FCM token. After registration, confirm the backend
has saved it in the `push_tokens` table. See
`backend/PUSH_NOTIFICATION_BACKEND_SETUP.md` for Firebase Admin and delivery
verification steps.
