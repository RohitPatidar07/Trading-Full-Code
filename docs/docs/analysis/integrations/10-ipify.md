# Third-Party Integration: ipify

## 1. API/service name
ipify.org

## 2. Purpose
Capture client public IP address for security headers.

## 3. Which feature uses it
- IP Security & Audit
- All authenticated API calls

## 4. Frontend files using it
- `Trading_Frontend-main/src/utils/api.js`
- `Trading_Webview-main/src/services/api.js`
- `trading-updated-apk-main/src/services/api.js`

## 5. Backend files using it
- Backend reads `X-Client-IP` header.

## 6. SDK/package used
- Native `fetch`

## 7. API endpoints/methods used
- `GET https://api.ipify.org?format=json`

## 8. Authentication method
- None.

## 9. Webhooks
- No.

## 10. WebSocket/realtime connection
- No.

## 11. Environment variables required
- None.

## 12. Database dependencies
- `ip_logins`, `ip_logs`

## 13. Other features depending on it
- IP audit
- Risk score

## 14. Complexity
Low

## 15. Risk if this integration is changed
- IP header missing; reduced audit capability.
- Privacy leak to third-party service.

## 16. Whether it deserves a dedicated specialist agent
No. Include under **Auth & Security Agent**.
