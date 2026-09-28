# Third-Party Integration: Socket.IO

## 1. API/service name
Socket.IO

## 2. Purpose
Real-time bidirectional communication: price ticks, notifications, alerts, trade updates, support messages.

## 3. Which feature uses it
- Market Data & Watchlists
- Real-time Notifications & Alerts
- Support Ticket Chat
- Trade execution updates

## 4. Frontend files using it
- `Trading_Frontend-main/src/context/MarketDataContext.jsx`
- `Trading_Frontend-main/src/context/MarketContext.jsx`
- `Trading_Frontend-main/src/hooks/useNotifications.js`
- `Trading_Webview-main/src/context/TradeContext.jsx`
- `trading-updated-apk-main/src/context/TradeContext.js`

## 5. Backend files using it
- `sharemarket-aws-backend-master/src/config/socket.js`
- `sharemarket-aws-backend-master/src/services/MarketDataService.js`
- `sharemarket-aws-backend-master/src/controllers/notificationController.js`
- `sharemarket-aws-backend-master/src/services/alertMonitoringService.js`

## 6. SDK/package used
- `socket.io` (server)
- `socket.io-client` (clients)

## 7. API endpoints/methods used
- WebSocket connection at `/socket.io`
- Events emitted: `price_update`, `market_data_update`, `notification`, `alert_triggered`, `trade_update`, `support_message_received`
- Events received: `join`, `subscribe_market`

## 8. Authentication method
- JWT token passed in socket auth handshake or `join` payload.

## 9. Webhooks
- No.

## 10. WebSocket/realtime connection
- Yes — this is the realtime transport.

## 11. Environment variables required
- `VITE_SOCKET_URL` (frontend/webview)
- `SOCKET_URL` (mobile/webview hardcoded)

## 12. Database dependencies
- None directly, but emits data derived from `scrip_ticks_history`, `notifications`, `alerts`, `support_tickets`.

## 13. Other features depending on it
- All real-time features across all clients.

## 14. Complexity
Critical

## 15. Risk if this integration is changed
- Real-time prices stop across all clients.
- Notifications and alerts fail silently.
- Event contract changes break client UIs.

## 16. Whether it deserves a dedicated specialist agent
Yes. Include under **Market Data Agent** due to criticality and event-contract ownership.
