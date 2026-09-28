# Feature: Paper Trading

## 1. Feature name
Paper Trading (Simulation)

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/paper/*` (if present)
- `Trading_Webview-main/src/pages/*` (paper mode if present)
- `trading-updated-apk-main/src/screens/*` (paper mode if present)

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/paperTradingController.js`
- `sharemarket-aws-backend-master/src/routes/paperRoutes.js`
- `sharemarket-aws-backend-master/src/services/*` (may reuse market data services)

## 4. Database tables/models involved
- `paper_orders`
- `paper_positions`
- `paper_trades`
- `paper_holdings`
- `paper_gtt_triggers`
- `users` (paper/demo flag)

## 5. Third-party APIs/services involved
- Zerodha Kite / AllTick (live prices for simulation)
- Socket.IO

## 6. API endpoints
- `POST /api/paper/orders`
- `GET /api/paper/positions`
- `GET /api/paper/holdings`
- `POST /api/paper/gtt`
- `GET /api/paper/historical`

## 7. Authentication/authorization dependencies
- Valid JWT.
- Demo/paper account flag.

## 8. Important business logic
- Mirrors real trading lifecycle without real money movement.
- Uses parallel paper tables.
- Live prices drive simulated P&L.
- Useful for testing strategies and onboarding.

## 9. External dependencies
- Market data feed.
- MySQL paper tables.

## 10. Potential risks/dependencies between modules
- Paper logic must mirror real trade math or users get misleading results.
- Changes to real trading engine should be reflected in paper trading.

## 11. What should be handled by a dedicated coding agent
A **Trading-Engine Agent** should own paper trading parity with real trading.
