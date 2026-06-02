# SafeVic Android Setup

SafeVic uses Capacitor to wrap the existing React + Vite frontend as an Android app. The web app still runs normally with `npm run dev`.

## Install Dependencies

```bash
npm install
```

## Configure API URL

Create a local `.env` file from `.env.example`.

For normal web development:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

For the Android emulator, use:

```bash
VITE_API_BASE_URL=http://10.0.2.2:5000/api
```

For a physical Android phone, use your computer LAN IP, for example:

```bash
VITE_API_BASE_URL=http://192.168.1.10:5000/api
```

For production, use your deployed backend URL.

## Build and Sync Android

```bash
npm run build
npx cap sync android
```

Or use the shortcut:

```bash
npm run android:build
```

## Open in Android Studio

```bash
npx cap open android
```

Or use:

```bash
npm run android:open
```

## Notes

The Android project includes internet and location permissions. Current SafeVic geolocation code continues to use browser `navigator.geolocation`, which works for web and Capacitor WebView permission prompts.
