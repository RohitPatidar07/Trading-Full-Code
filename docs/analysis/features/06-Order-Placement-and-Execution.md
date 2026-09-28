# Feature: Order Placement & Execution

## 1. Feature name
Order Placement & Execution

## 2. Related frontend files
- `Trading_Frontend-main/src/components/CreateTradeForm.jsx`
- `Trading_Frontend-main/src/pages/trades/TradesPage.jsx`
- `Trading_Frontend-main/src/pages/trades/CreateTradePage.jsx` (if exists)
- `Trading_Webview-main/src/pages/OrderDetail.jsx`
- `trading-updated-apk-main/src/screens/others/OrderDetailScreen.js`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/tradeController.js`
- `sharemarket-aws-backend-master/src/routes/tradeRoutes.js`
- `sharemarket-aws-backend-master/src/services/TradeService.js`
- `sharemarket-aws-backend-master/src/services/MarginService.js` (if exists)
- `sharemarket-aws-backend-master/src/middleware/auth.js`

## 4. Database tables/models involved
- `trades` — core order/position table
- `ledger` — margin/funds movement on execution
- `users` — balance
- `user_segments` — segment permissions and brokerage/margin config
- `broker_shares` — broker revenue sharing
- `client_settings` — risk controls
- `scrip_data` — lot size, margin, expiry
- `banned_scrips` / `banned_limit_orders`

## 5. Third-party APIs/services involved
- Zerodha Kite (market data for order validation/depth)
- AllTick (crypto/forex/commodity prices)

## 6. API endpoints
- `POST /api/trades/place`
- `POST /api/trades/close`
- `DELETE /api/trades/:id`
- `POST /api/trades/restore`
- `POST /api/margins/validate`
- `GET /api/margins/calculate`

## 7. Authentication/authorization dependencies
- Valid JWT.
- `TRADER` role (or appropriate admin/broker acting for a client).
- Transaction password for non-`TRADER` roles.
- Segment permission in `user_segments`.

## 8. Important business logic
- Supports MARKET and LIMIT orders.
- Segment detection: MCX, EQUITY, OPTIONS, COMEX, FOREX, CRYPTO.
- Lot/unit mode conversion based on `scrip_data.lot_size`.
- Margin validation before order acceptance.
- Brokerage calculation per `user_segments` / `broker_shares`.
- Anti-scalping hold-time check before close (`client_settings.min_time_to_book_profit`).
- Group trades linked by `group_id`.

## 9. External dependencies
- Live price data from Market-Data-Agent domain.
- MySQL `trades`, `ledger`, `user_segments` tables.

## 10. Potential risks/dependencies between modules
- `tradeController.js` is ~3,176 lines — high regression risk.
- Dynamic SQL in some trade queries requires careful review.
- Margin/P&L utility functions duplicated across backend and clients must stay consistent.
- Hold-time rules span Trading-Engine and client validation.

## 11. What should be handled by a dedicated coding agent
A dedicated **Trading-Engine Agent** should own order placement, execution, trade lifecycle, and related calculations.
