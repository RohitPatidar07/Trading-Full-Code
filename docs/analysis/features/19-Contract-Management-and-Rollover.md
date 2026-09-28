# Feature: Contract Management & Rollover

## 1. Feature name
Contract Management & Rollover

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/admin/ContractManagement.jsx`
- `Trading_Frontend-main/src/components/CreateTradeForm.jsx` (contract selection)
- `Trading_Webview-main/src/pages/Dashboard.jsx` (contract display)
- `trading-updated-apk-main/src/screens/tabs/DashboardScreen.js`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/contractController.js`
- `sharemarket-aws-backend-master/src/routes/contractRoutes.js`
- `sharemarket-aws-backend-master/src/controllers/systemController.js` (sync-scrips, expiry rules)
- `sharemarket-aws-backend-master/src/routes/systemRoutes.js`
- `sharemarket-aws-backend-master/src/services/MarketDataService.js` (instrument sync)

## 4. Database tables/models involved
- `scrip_data`
- `expiry_rules`
- `market_groups` / `market_group_items`
- `banned_scrips`
- `trades` (rollover creates new trade records)

## 5. Third-party APIs/services involved
- Zerodha Kite (instrument list)
- AllTick (for some segments)

## 6. API endpoints
- `GET/POST /api/contracts`
- `POST /api/contracts/rollover`
- `GET /api/contracts/market-watch-expiries`
- `GET/POST /api/system/expiry-rules`
- `POST /api/system/sync-scrips`

## 7. Authentication/authorization dependencies
- Valid JWT.
- Admin/broker for rollover and contract enable/disable.

## 8. Important business logic
- Instruments loaded from Kite and stored in `scrip_data`.
- Contracts can be enabled/disabled for trading.
- Rollover moves an open position from an expiring contract to the next expiry.
- Expiry rules drive auto square-off and settlement timing.
- Market-watch expiry list helps users pick active contracts.

## 9. External dependencies
- Kite instrument sync.
- MySQL `scrip_data`, `expiry_rules`.

## 10. Potential risks/dependencies between modules
- Rollover affects open trades and P&L — must coordinate with Trading-Engine.
- Instrument sync affects watchlists, order placement, and market data.
- Contract filtering must stay consistent across clients.

## 11. What should be handled by a dedicated coding agent
A **Market Data Agent** should own instrument/contract sync; a **Trading-Engine Agent** should own rollover trade logic.
