# Third-Party Integration: Expo Services

## 1. API/service name
Expo SDK / EAS (Expo Application Services)

## 2. Purpose
Mobile app framework, native APIs, build distribution, and OTA updates.

## 3. Which feature uses it
- Mobile app build and runtime
- Image/audio/permissions
- Navigation bar / splash / safe area

## 4. Frontend files using it
- `trading-updated-apk-main/App.js`
- `trading-updated-apk-main/src/screens/others/DepositRequestScreen.js`
- `trading-updated-apk-main/src/screens/others/AiAssistantScreen.js`
- `trading-updated-apk-main/src/screens/others/EconomicCalendarScreen.js`
- `trading-updated-apk-main/src/screens/others/LearningScreen.js`

## 5. Backend files using it
- None.

## 6. SDK/package used
- `expo` SDK
- `expo-image-picker`
- `expo-audio`
- `expo-media-library`
- `expo-linear-gradient`
- `expo-splash-screen`
- `expo-updates`
- `expo-navigation-bar`
- `expo-secure-store` (recommended, not yet used)
- `expo-font`
- `@react-navigation/native`
- `react-native-webview`
- `lucide-react-native`
- `@expo/vector-icons`

## 7. API endpoints/methods used
- EAS Build APIs via `eas.json`
- OTA updates via `expo-updates`

## 8. Authentication method
- EAS project ID embedded in `app.json`.

## 9. Webhooks
- EAS build webhooks possible (not currently used).

## 10. WebSocket/realtime connection
- No.

## 11. Environment variables required
- None currently; backend URLs are hardcoded.

## 12. Database dependencies
- None.

## 13. Other features depending on it
- Entire mobile app

## 14. Complexity
High

## 15. Risk if this integration is changed
- Version mismatch (Expo 57 vs SDK 54 vs RN 0.86) can break builds.
- Native permissions may cause Play Store / App Store rejection.
- EAS build artifacts are committed (`build.txt`, `build_list.txt`).

## 16. Whether it deserves a dedicated specialist agent
Yes. Include under **Mobile Agent** due to native complexity and build configuration.
