# Third-Party Integration: YouTube IFrame API

## 1. API/service name
YouTube IFrame / embed API

## 2. Purpose
Learning module video player.

## 3. Which feature uses it
- Learning / Trading Academy

## 4. Frontend files using it
- `Trading_Webview-main/src/pages/Account.jsx`
- `trading-updated-apk-main/src/screens/others/LearningScreen.js`

## 5. Backend files using it
- None.

## 6. SDK/package used
- YouTube IFrame API (`https://www.youtube.com/iframe_api`)
- `react-native-webview` (mobile)

## 7. API endpoints/methods used
- `https://www.youtube.com/embed/<VIDEO_ID>?enablejsapi=1`
- Mobile hardcoded `VIDEO_ID = 'grAMOvn4pFM'`

## 8. Authentication method
- None.

## 9. Webhooks
- No.

## 10. WebSocket/realtime connection
- No.

## 11. Environment variables required
- None.

## 12. Database dependencies
- None.

## 13. Other features depending on it
- Learning content display

## 14. Complexity
Low

## 15. Risk if this integration is changed
- Video fails to load.
- Mobile WebView `postMessage` handling lacks origin validation.

## 16. Whether it deserves a dedicated specialist agent
No. Include under **WebView Agent** / **Mobile Agent**.
