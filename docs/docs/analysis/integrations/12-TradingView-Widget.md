# Third-Party Integration: TradingView Widget

## 1. API/service name
TradingView Embed Widget

## 2. Purpose
Display economic calendar widget in WebView account screen.

## 3. Which feature uses it
- Economic Calendar (WebView)

## 4. Frontend files using it
- `Trading_Webview-main/src/pages/Account.jsx`

## 5. Backend files using it
- None.

## 6. SDK/package used
- TradingView embed script loaded via `<script>`.

## 7. API endpoints/methods used
- `https://s3.tradingview.com/external-embedding/embed-widget-events.js`

## 8. Authentication method
- None.

## 9. Webhooks
- No.

## 10. WebSocket/realtime connection
- No (widget loads its own iframe).

## 11. Environment variables required
- None.

## 12. Database dependencies
- None.

## 13. Other features depending on it
- Account → Economic Calendar view

## 14. Complexity
Low

## 15. Risk if this integration is changed
- Calendar view breaks.
- `innerHTML` injection of external script is a supply-chain XSS risk.

## 16. Whether it deserves a dedicated specialist agent
No. Include under **WebView Agent** / UI agent.
