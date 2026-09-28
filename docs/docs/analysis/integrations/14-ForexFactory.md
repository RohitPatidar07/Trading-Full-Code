# Third-Party Integration: Forex Factory

## 1. API/service name
Forex Factory Economic Calendar

## 2. Purpose
External economic calendar link/display.

## 3. Which feature uses it
- Economic Calendar (WebView/Mobile)

## 4. Frontend files using it
- `Trading_Webview-main/src/pages/Account.jsx`
- `trading-updated-apk-main/src/screens/others/EconomicCalendarScreen.js`

## 5. Backend files using it
- None.

## 6. SDK/package used
- `react-native-webview` (mobile)
- Browser `window.open` (WebView)

## 7. API endpoints/methods used
- `https://www.forexfactory.com/calendar`

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
- Economic calendar fallback

## 14. Complexity
Low

## 15. Risk if this integration is changed
- Link dead / calendar blank.
- `window.open` without `rel="noopener noreferrer"` exposes `window.opener`.
- Mobile WebView has no origin whitelist.

## 16. Whether it deserves a dedicated specialist agent
No. Include under **WebView Agent** / **Mobile Agent**.
