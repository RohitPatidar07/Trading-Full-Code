# Feature: Positions, Portfolio & P&L

## 1. Feature name
Positions, Portfolio & P&L Calculation

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/positions/ActivePositionsPage.jsx`
- `Trading_Frontend-main/src/pages/positions/ClosedPositionsPage.jsx`
- `Trading_Frontend-main/src/pages/trades/ActiveTradesPage.jsx`
- `Trading_Frontend-main/src/components/ActivePositionsTable.jsx`
- `Trading_Frontend-main/src/components/ActiveTradesTable.jsx`
- `Trading_Frontend-main/src/utils/equityPnL.js`
- `Trading_Frontend-main/src/utils/usdPnL.js`
- `Trading_Webview-main/src/pages/Portfolio.jsx`
- `Trading_Webview-main/src/pages/Trades.jsx`
- `trading-updated-apk-main/src/screens/tabs/PortfolioScreen.js`
- `trading-updated-apk-main/src/screens/tabs/TradesScreen.js`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/tradeController.js`
- `sharemarket-aws-backend-master/src/controllers/portfolioController.js`
- `sharemarket-aws-backend-master/src/controllers/dashboardController.js`
- `sharemarket-aws-backend-master/src/services/TradeService.js`
- `sharemarket-aws-backend-master/src/utils/equityPnL.js`
- `sharemarket-aws-backend-master/src/utils/usdPnL.js`
- `sharemarket-aws-backend-master/src/utils/segmentMargin.js`

## 4. Database tables/models involved
- `trades` — positions and closed trades
- `ledger` — realized P&L and charges
- `users` — balance, credit limit
- `user_segments` — segment config
- `broker_shares` — sharing percentages
- `scrip_data` — lot size, margin

## 5. Third-party APIs/services involved
- Zerodha Kite / AllTick (live LTP for unrealized P&L)
- Socket.IO (real-time price updates)

## 6. API endpoints
- `GET /api/trades/active`
- `GET /api/trades/closed`
- `GET /api/portfolio/balance`
- `GET /api/portfolio/ledger`
- `GET /api/dashboard/m2m`
- `GET /api/dashboard/broker-m2m`

## 7. Authentication/authorization dependencies
- Valid JWT.
- Role-based access (trader sees own; broker/admin see hierarchy).

## 8. Important business logic
- Aggregates open trades by symbol to show net position.
- Live unrealized P&L recalculates on every tick.
- Realized P&L recorded in `ledger` on trade close.
- Segment-specific calculation: equity, MCX, options, USD segments.
- Brokerage and swap deducted from P&L.
- M2M dashboard shows mark-to-market across users/brokers.

## 9. External dependencies
- Live price feed consistency.
- P&L utility functions duplicated in backend and clients.

## 10. Potential risks/dependencies between modules
- Client-side P&L must match backend or users see conflicting numbers.
- Symbol key mismatch causes stale/wrong P&L.
- Portfolio aggregation logic duplicated in `TradeContext` (WebView/mobile).
- `livePrices` sometimes stores number vs object — breaks P&L calc.

## 11. What should be handled by a dedicated coding agent
A **Trading-Engine Agent** should own P&L correctness, position aggregation, and portfolio math.
