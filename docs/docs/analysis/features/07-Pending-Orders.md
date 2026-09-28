# Feature: Pending Orders

## 1. Feature name
Pending Orders (Limit / Stop-Loss Orders)

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/orders/PendingOrdersPage.jsx`
- `Trading_Frontend-main/src/components/CreateTradeForm.jsx` (limit order creation)
- `Trading_Webview-main/src/pages/Trades.jsx` (pending tab)
- `trading-updated-apk-main/src/screens/tabs/TradesScreen.js` (pending tab)

## 3. Related backend files
- `sharemarket-aws-backend-master/src/services/PendingOrderService.js`
- `sharemarket-aws-backend-master/src/controllers/tradeController.js`
- `sharemarket-aws-backend-master/src/services/TradeService.js`
- `sharemarket-aws-backend-master/src/services/MarketDataService.js` (price feed)

## 4. Database tables/models involved
- `trades` (`is_pending = 1`)
- `pending_orders` (if separate table exists)
- `scrip_data`
- `user_segments`
- `client_settings`

## 5. Third-party APIs/services involved
- Zerodha Kite / AllTick (live price feed for trigger evaluation)
- Socket.IO (price updates)

## 6. API endpoints
- `POST /api/trades/place` (limit/stop order)
- `POST /api/trades/modify-pending`
- `DELETE /api/trades/:id` (cancel)

## 7. Authentication/authorization dependencies
- Valid JWT.
- Transaction password for modification/cancellation.
- Role/segment permission.

## 8. Important business logic
- Pending orders wait for price to hit limit/stop trigger.
- `PendingOrderService` polls live prices and converts eligible pending orders into executed trades.
- Modification can change quantity and trigger price.
- Cancellation removes pending order without ledger impact.
- Must respect banned-scrip and segment restrictions.

## 9. External dependencies
- Continuous live price feed from Market Data domain.
- MySQL `trades` table.

## 10. Potential risks/dependencies between modules
- Race conditions between price updates and pending-order runner.
- If `PendingOrderService` misses a tick, orders may not execute.
- Client-side pending-order state must sync with backend execution.

## 11. What should be handled by a dedicated coding agent
A **Trading-Engine Agent** should own pending-order execution, modification, and cancellation logic.
