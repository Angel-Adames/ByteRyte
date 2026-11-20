# ByteRyte on iPhone

The iOS app is the same static site as GitHub Pages, bundled inside a [Capacitor](https://capacitorjs.com/) WKWebView. It does not load https://angel-adames.github.io/ByteRyte/. Progress stays in the web view’s local storage on the device. GitHub Pages is unchanged: it still serves the files at the repository root.

`native.js` is copied into the iOS bundle only. It turns on the status-bar overlay (the site already pads the notch), stops the rubber-band bounce, asks the keyboard to resize the page for typed-code questions, and routes the existing `navigator.vibrate` calls to a short haptic tap. Lofi and sound effects use the same Web Audio path as the site, including the silent-switch unlock.

## What GitHub Actions does

`.github/workflows/ios.yml` runs on a macOS runner. It installs the packages, bundles `www/`, runs CocoaPods, builds the App scheme for the iOS Simulator, launches it, and uploads a screenshot. That build does not use a signing certificate. It does not make an App Store or TestFlight build.

## Open it on your Mac

1. Install Xcode from the Mac App Store, then open it once so it can install the extra tools.
2. Clone this repository.
3. In the repository root, run `npm install` and `npm run ios:sync`.
4. Open `ios/App/App.xcworkspace` in Xcode. Open the workspace, not `App.xcodeproj`.
5. Pick the App target and a simulator, then press Run.

## Run it on your iPhone with a free Apple ID

1. Connect the iPhone and trust the computer.
2. In Xcode, set the run destination to that iPhone.
3. Select the App target, open Signing & Capabilities, and check “Automatically manage signing”.
4. Choose your Personal Team (the Apple ID signed into Xcode). Xcode may rewrite the bundle id if `app.byteryte.learn` is already taken. That is fine for a personal install.
5. Press Run. On the phone, go to Settings → General → VPN & Device Management and trust the developer certificate. A free personal team install expires after about 7 days, and you can have only a few apps installed this way.

## What the $99/year Apple Developer Program adds

A paid membership is required for TestFlight and the App Store. It also keeps a development install from expiring every week, allows more registered devices, and is what you need for push notifications and some capabilities this app does not use. Building for the simulator, and running on your own phone with a free Apple ID, does not need it.
