# Third-Party Integration: Zerodha Kite Connect

## 1. API/service name
Zerodha Kite Connect

## 2. Purpose
Broker integration for Indian market data (NSE, NFO, MCX), instrument master, live quotes, margins, holdings, positions, and order placement.

## 3. Which feature uses it
- Market Data & Watchlists
- Options Chain / MCX Futures Chain
- Order Placement
- Kite Dashboard
- Contract Management / Instrument Sync
- Paper Trading (data source)

## 4. Frontend files using it
- `Trading_Frontend-main/src/pages/dashboard/KiteDashboard.jsx`
- `Trading_Frontend-main/src/pages/market/MarketWatchPage.jsx`
- `Trading_Frontend-main/src/pages/market/OptionsChainTest.jsx`
- `Trading_Frontend-main/src/pages/market/McxFuturesChain.jsx`
- `Trading_Frontend-main/src/services/api.js` (Kite section)
- `Trading_Webview-main/src/context/TradeContext.jsx`
- `Trading_Webview-main/src/pages/Dashboard.jsx`
- `trading-updated-apk-main/src/context/TradeContext.js`
- `trading-updated-apk-main/src/screens/tabs/DashboardScreen.js`

## 5. Backend files using it
- `sharemarket-aws-backend-master/src/routes/kiteRoutes.js` (2,403 lines)
- `sharemarket-aws-backend-master/src/controllers/kiteController.js`
- `sharemarket-aws-backend-master/src/services/KiteAuthService.js`
- `sharemarket-aws-backend-master/src/services/MarketDataService.js`
- `sharemarket-aws-backend-master/src/config/socket.js`
- `sharemarket-aws-backend-master/src/data/kite_session.json`

## 6. SDK/package used
- `kiteconnect` (NPM)
- `puppeteer` (auto-login)
- Native `ws` (ticker)

## 7. API endpoints/methods used
Backend routes:
- `/api/kite/login`
- `/api/kite/callback`
- `/api/kite/set-token`
- `/api/kite/status`
- `/api/kite/disconnect`
- `/api/kite/margins`
- `/api/kite/profile`
- `/api/kite/market-dashboard`
- `/api/kite/watchlist`
- `/api/kite/instruments`
- `/api/kite/quote`
- `/api/kite/sync-instruments`

Kite SDK methods:
- `generateSession`, `getProfile`, `getMargins`, `getHoldings`, `getPositions`, `getOrders`, `getInstruments`, `getQuote`, `getLTP`

## 8. Authentication method
- OAuth2 flow via Kite login URL.
- Access token stored in `user_kite_sessions` table.
- `src/data/kite_session.json` contains committed session tokens (security risk).

## 9. Webhooks
- Not currently used for order updates (polling/Socket.IO used).

## 10. WebSocket/realtime connection
- Yes. Backend connects to Kite Ticker WebSocket and relays ticks to clients via Socket.IO.

## 11. Environment variables required
- `KITE_API_KEY`
- `KITE_API_SECRET`
- `ZERODHA_USER_ID`
- `ZERODHA_PASSWORD`
- `ZERODHA_TOTP_SECRET`
- `PUPPETEER_EXECUTABLE_PATH` (optional)

## 12. Database dependencies
- `user_kite_sessions`
- `scrip_data`
- `scrip_ticks_history`

## 13. Other features depending on it
- Trading-Engine (order validation, margin)
- Positions/Portfolio P&L
- RMS/M2M
- Options chain / MCX chain

## 14. Complexity
Critical

## 15. Risk if this integration is changed
- Live market data for Indian segments stops.
- Order placement and margin checks fail.
- Instrument master becomes stale.
- Token expiry/auto-login is brittle.

## 16. Whether it deserves a dedicated specialist agent
Yes. A dedicated **Market Data Agent** / **Kite Integration Agent** is justified due to size, criticality, and isolation.
