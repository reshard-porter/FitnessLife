# FitnessLife — iOS project

The FitnessLife React app wrapped in a Capacitor 8 iOS shell. Open it in Xcode, pick your Apple ID as the signing team, and run it on your iPhone.

On the phone the app runs full-screen with the FitnessLife icon, a launch screen that hands off to an animated intro, and the real status bar and home indicator. The web build is already inside the Xcode project, so you don't need Node.js just to install it.

## What you need

- A Mac with Xcode 16 or later
- An Apple ID (a free one works; see the note on free accounts below)
- An iPhone on iOS 15 or later and a cable (or the same Wi-Fi network after the first wired run)

## Install on your iPhone

1. Unzip the folder and open **`ios/App/App.xcodeproj`** in Xcode.
   On first open, Xcode downloads the Capacitor Swift package from GitHub. Wait until "Resolving Package Graph" finishes in the status bar.
2. In the left sidebar, click the blue **App** project, then the **App** target, then **Signing & Capabilities**.
   - Tick **Automatically manage signing**.
   - Set **Team** to your Apple ID (Xcode → Settings → Accounts to add it if it isn't listed).
   - Change **Bundle Identifier** from `com.example.fitnesslife` to something unique to you, such as `com.yourname.fitnesslife`.
3. Connect your iPhone. If it asks, tap **Trust This Computer**.
   On iOS 16 and later, turn on **Settings → Privacy & Security → Developer Mode** and restart the phone when asked.
4. Choose your iPhone in the device menu at the top of the Xcode window and press **Run** (▶).
5. The first time, iOS blocks the app until you trust it: **Settings → General → VPN & Device Management →** your Apple ID → **Trust**. Then open the app again.

The app appears on your home screen as **FitnessLife**. The Xcode target is still called "App" (the Capacitor default); only the name on the phone changed.

**Free Apple ID:** apps signed with a free account stop opening after 7 days. Press Run in Xcode again to reinstall. A paid Apple Developer Program membership removes the limit and is required for TestFlight or the App Store.

**Upgrading from the Sworkit Pro Ultra build:** this has a new bundle ID, so it installs as a separate app. Delete the old one from your phone.

## Spotify

Open the music sheet (tap the player bar above the tabs) and switch **FitnessLife Beats → Spotify**.

- FitnessLife checks whether the Spotify app is installed and shows it in the sheet.
- **Open Spotify** jumps to the Spotify app. The six zone mixes (Warm-up through Peak effort, plus Stretch & recover) open Spotify searches matched to each heart-rate zone. Your current zone is highlighted.
- Start any playlist in Spotify and come back. The workout timer, voice coach and 3-2-1 chimes play over your music, and **Spotify's volume drops while the coach speaks** and comes back afterwards.
- The built-in beats stop while Spotify is selected. Your choice is remembered.

FitnessLife does not log in to Spotify, read your playlists or control playback. That needs the Spotify iOS SDK with your own Spotify developer Client ID, which is a separate project.

How it works: `ios/App/App/FitnessNativePlugin.swift` (registered in `MainViewController.swift`) detects Spotify with `canOpenURL`, opens links with `UIApplication.open`, and switches the audio session to `.duckOthers` during voice cues. `LSApplicationQueriesSchemes` in `Info.plist` allows the `spotify` check.

## Using it on the phone

- Tap **Start Workout** to begin. Music, voice cues and the 3-2-1 chimes start on that tap, because iOS only allows audio after you touch the screen.
- Audio plays even with the silent switch on, and mixes with Spotify or Apple Music instead of stopping them. This is set in `ios/App/App/AppDelegate.swift`.
- Heart rate, calories, SpO₂ and HRV are simulated, the same as in the web studio. Reading real HealthKit data needs the native work described below.
- The Apple Watch companion, the iOS/Material switch and the Studio view belong to the web studio and are not shown in the phone app. To use them, double-click `web-studio/FitnessLife-Studio.html` on your Mac or PC.

## Changing the app

The whole app is `src/App.jsx`. After editing it:

```bash
npm install        # first time only
npm run sync       # rebuilds www/ and copies it into the iOS project
```

Then press Run in Xcode again. `npm run build` only rebuilds `www/` without touching the iOS project.

## Troubleshooting the build

- **"capacitor.config.json / config.xml / public couldn't be opened because there is no such file"**: the generated web files are missing from `ios/App/App/`. Pull the latest version of this repo (they are now committed), or run `npm install && npm run sync`.
- **"Command Ld failed with a nonzero exit code"** right after those errors: clear the stale build with **Product → Clean Build Folder** (⇧⌘K), then **File → Packages → Reset Package Caches**, and press Run again. If it still fails, open the Report navigator (⌘9), click the failed build and copy the lines above "Ld failed" (usually "Undefined symbol …"); they name the real cause.

## Icon and launch screen

- App icon: `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (1024 × 1024, no transparency)
- Launch image: `ios/App/App/Assets.xcassets/Splash.imageset/` (2732 × 2732, centred so it crops cleanly on every iPhone)
- After launch, the app plays an animated intro (`LaunchSplash` in `src/App.jsx`). Tap it to skip.
- Source files are in `brand/`, including the mark as an SVG.

## Going further: real Apple Watch and HealthKit

`native-extras/` holds the production sources shown in the app's Native Bridge panel. They are **not** compiled into the Xcode project yet, because each one needs a capability or target that ties to your Apple developer account.

| File | What it does | How to wire it up |
|---|---|---|
| `ios-plugin/WatchBridgePlugin.swift` | WatchConnectivity bridge (`sendMessage`, `updateApplicationContext`) exposed to JavaScript as `WatchBridge` | Drag it into the **App** group in Xcode (tick "Add to target: App"). In `MainViewController.swift`, add `bridge?.registerPluginInstance(WatchBridgePlugin())` inside `capacitorDidLoad()`. |
| `watchOS/PhoneLink.swift`, `watchOS/WorkoutManager.swift` | SwiftUI watch app side: receives the workout state, sends wrist commands, runs a live `HKWorkoutSession` and streams heart rate | **File → New → Target → watchOS → App**, name it, then add both files to the new watch target. Add the **HealthKit** capability to the watch target. |
| `web/watchBridge.ts`, `web/health.ts`, `web/mediaSession.ts` | TypeScript side of the bridge, HealthKit reads through `@perfood/capacitor-healthkit`, lock-screen controls | Copy into `src/`, `npm install @perfood/capacitor-healthkit`, call them from `App.jsx`, then `npm run sync`. Check the plugin's README for the exact HealthKit sample names in the version you install. |

For HealthKit, also add **HealthKit** under Signing & Capabilities on the App target, and add `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription` strings to `ios/App/App/Info.plist`.

## Project layout

```
src/App.jsx                       the app (single file)
src/main.jsx, styles.css          entry point and Tailwind/Mulish styles
www/                              built web app (output of npm run build)
ios/App/App.xcodeproj             open this in Xcode
ios/App/App/FitnessNativePlugin.swift   Spotify detection, links and audio ducking
ios/App/App/MainViewController.swift    registers the native plugin
ios/App/App/public                copy of www/ that ships inside the iPhone app
brand/                            icon, launch image and logo SVG
native-extras/                    watchOS, HealthKit and WatchConnectivity sources
web-studio/FitnessLife-Studio.html  the full device studio (iPhone + Apple Watch simulator)
capacitor.config.json             app id, name and iOS web view settings
```
