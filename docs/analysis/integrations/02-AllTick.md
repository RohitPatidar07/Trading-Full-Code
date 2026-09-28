# Third-Party Integration: AllTick

## 1. API/service name
AllTick

## 2. Purpose
Crypto, forex, and commodity market data via WebSocket and HTTP.

## 3. Which feature uses it
- Crypto / Forex / Commodity market data
- WebView/mobile watchlist for USD segments
- Market Data Page

## 4. Frontend files using it
- `Trading_Frontend-main/src/pages/market/MarketDataPage.jsx`
- `Trading_Webview-main/src/context/TradeContext.jsx` (market data section)
- `trading-updated-apk-main/src/context/TradeContext.js` (market data section)

## 5. Backend files using it
- `sharemarket-aws-backend-master/src/services/allticks.service.js`
- `sharemarket-aws-backend-master/src/services/MarketDataService.js`
- `sharemarket-aws-backend-master/src/controllers/marketDataController.js`

## 6. SDK/package used
- Native `ws` / `fetch` (no dedicated SDK found)

## 7. API endpoints/methods used
- AllTick WebSocket endpoint
- AllTick HTTP endpoints for crypto/forex/commodity
- Backend proxies via:
  - `/api/market-data/crypto`
  - `/api/market-data/forex`
  - `/api/market-data/commodity`
  - `/api/market-data/all`

## 8. Authentication method
- API key passed in connection or headers.

## 9. Webhooks
- No.

## 10. WebSocket/realtime connection
- Yes. AllTick WebSocket provides live ticks; backend may fall back to HTTP polling.

## 11. Environment variables required
- `ALLTICKS_API_KEY`

## 12. Database dependencies
- `scrip_data`
- `scrip_ticks_history`
- `commodity_forex_crypto_lot_sizes`

## 13. Other features depending on it
- Market Data Agent domain
- Trading-Engine (price validation for USD segments)
- Portfolio P&L for crypto/forex/commodity

## 14. Complexity
High

## 15. Risk if this integration is changed
- Crypto/forex/commodity prices stop flowing.
- USD segment P&L becomes incorrect.
- Fallback logic between Kite and AllTick may break.

## 16. Whether it deserves a dedicated specialist agent
No separate agent needed; include under **Market Data Agent**.
