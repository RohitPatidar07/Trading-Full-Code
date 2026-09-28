# Feature: Market Data & Watchlists

## 1. Feature name
Market Data & Watchlists

## 2. Related frontend files
- `Trading_Frontend-main/src/context/MarketDataContext.jsx`
- `Trading_Frontend-main/src/context/MarketContext.jsx`
- `Trading_Frontend-main/src/pages/market/MarketWatchPage.jsx`
- `Trading_Frontend-main/src/pages/dashboard/KiteDashboard.jsx`
- `Trading_Frontend-main/src/pages/market/OptionsChainTest.jsx`
- `Trading_Frontend-main/src/pages/market/McxFuturesChain.jsx`
- `Trading_Frontend-main/src/pages/market/MarketDataPage.jsx`
- `Trading_Webview-main/src/context/TradeContext.jsx` (market data section)
- `Trading_Webview-main/src/pages/Dashboard.jsx`
- `Trading_Webview-main/src/components/TickerTape.jsx`
- `trading-updated-apk-main/src/context/TradeContext.js` (market data section)
- `trading-updated-apk-main/src/screens/tabs/DashboardScreen.js`
- `trading-updated-apk-main/src/screens/others/SearchScreen.js`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/services/MarketDataService.js`
- `sharemarket-aws-backend-master/src/services/allticks.service.js`
- `sharemarket-aws-backend-master/src/controllers/kiteController.js`
- `sharemarket-aws-backend-master/src/routes/kiteRoutes.js`
- `sharemarket-aws-backend-master/src/controllers/marketDataController.js`
- `sharemarket-aws-backend-master/src/routes/marketDataRoutes.js`
- `sharemarket-aws-backend-master/src/services/KiteAuthService.js`
- `sharemarket-aws-backend-master/src/config/socket.js`

## 4. Database tables/models involved
- `scrip_data` — instrument master
- `scrip_ticks_history` — tick store
- `market_groups` / `market_group_items` — watchlists/categories
- `user_kite_sessions` — Kite tokens
- `mcx_lot_sizes` / `commodity_forex_crypto_lot_sizes`
- `banned_scrips` / `banned_limit_orders`

## 5. Third-party APIs/services involved
- Zerodha Kite Connect
- AllTick
- Socket.IO
- Redis (optional caching)
- AWS S3 (tick export)
- Puppeteer (Kite auto-login)

## 6. API endpoints
- Kite: `/api/kite/login`, `/api/kite/callback`, `/api/kite/set-token`, `/api/kite/status`, `/api/kite/margins`, `/api/kite/profile`, `/api/kite/market-dashboard`, `/api/kite/watchlist`, `/api/kite/instruments`, `/api/kite/quote`, `/api/kite/sync-instruments`
- Market data: `/api/market-data/crypto`, `/api/market-data/forex`, `/api/market-data/commodity`, `/api/market-data/all`
- System: `/api/system/sync-scrips`
- Scrip ticks: `/api/scrip-ticks`, `/api/scrip-ticks/history`, `/api/scrip-ticks/export-pdf`, `/api/scrip-ticks/export-s3`, `/api/scrip-ticks/purge`

## 7. Authentication/authorization dependencies
- Valid JWT for most endpoints.
- Kite OAuth flow for broker token.

## 8. Important business logic
- Ingests live ticks from Kite Ticker and AllTick WebSocket.
- Normalizes symbol keys and broadcasts via Socket.IO.
- Supports watchlist categories: NFO_FUT, NFO_OPT, MCX_FUT, MCX_OPT, CRYPTO, FOREX, COMMODITY.
- Options chain and MCX futures chain data.
- Tick history persistence and export.
- Fallback between Kite and AllTick.

## 9. External dependencies
- Zerodha Kite Connect SDK.
- AllTick HTTP/WebSocket API.
- Socket.IO server and clients.
- Redis optional.

## 10. Potential risks/dependencies between modules
- `kiteRoutes.js` is 2,403 lines — highest integration complexity.
- Symbol key mismatch between `livePrices` and trade names.
- `livePrices` sometimes number, sometimes object.
- WebView/mobile demo fallback shows random prices offline.
- Committed Kite session tokens in `src/data/kite_session.json`.

## 11. What should be handled by a dedicated coding agent
A dedicated **Market Data Agent** should own Kite/AllTick integration, Socket.IO price contracts, instrument sync, watchlists, and tick history.
