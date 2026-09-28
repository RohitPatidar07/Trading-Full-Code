# Third-Party Integration: Puppeteer

## 1. API/service name
Puppeteer

## 2. Purpose
Headless browser automation for Zerodha Kite auto-login.

## 3. Which feature uses it
- Kite / Zerodha Authentication
- Market Data initialization

## 4. Frontend files using it
- None.

## 5. Backend files using it
- `sharemarket-aws-backend-master/src/services/KiteAuthService.js`
- `sharemarket-aws-backend-master/src/server.js` (cron wiring)

## 6. SDK/package used
- `puppeteer`

## 7. API endpoints/methods used
- Internal service methods; not exposed via HTTP.

## 8. Authentication method
- Uses `ZERODHA_USER_ID`, `ZERODHA_PASSWORD`, `ZERODHA_TOTP_SECRET` to automate login.

## 9. Webhooks
- No.

## 10. WebSocket/realtime connection
- No.

## 11. Environment variables required
- `ZERODHA_USER_ID`
- `ZERODHA_PASSWORD`
- `ZERODHA_TOTP_SECRET`
- `PUPPETEER_EXECUTABLE_PATH` (optional)

## 12. Database dependencies
- `user_kite_sessions`

## 13. Other features depending on it
- Kite token refresh
- Market data continuity

## 14. Complexity
High

## 15. Risk if this integration is changed
- Kite auto-login breaks, causing market data outage.
- Brittle against Kite UI changes.
- Headless browser increases resource usage.

## 16. Whether it deserves a dedicated specialist agent
No separate agent; include under **Market Data Agent** / **Kite Integration Agent**.
