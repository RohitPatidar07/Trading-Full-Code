# Feature: Target, Stop-Loss & Bracket Orders

## 1. Feature name
Target, Stop-Loss & Bracket Orders

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/orders/PendingOrdersPage.jsx`
- `Trading_Frontend-main/src/components/CreateTradeForm.jsx`
- `Trading_Webview-main/src/pages/Trades.jsx`
- `Trading_Webview-main/src/pages/Portfolio.jsx`
- `trading-updated-apk-main/src/screens/tabs/TradesScreen.js`
- `trading-updated-apk-main/src/screens/tabs/PortfolioScreen.js`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/services/targetSLService.js`
- `sharemarket-aws-backend-master/src/controllers/tradeController.js`
- `sharemarket-aws-backend-master/src/services/TradeService.js`
- `sharemarket-aws-backend-master/src/services/PendingOrderService.js` (if SL stored as pending)

## 4. Database tables/models involved
- `trades` (`target_price`, `stop_loss`, `is_pending`)
- `pending_orders` (if separate table for target/SL legs)
- `paper_gtt_triggers` (paper trading GTT)

## 5. Third-party APIs/services involved
- Zerodha Kite / AllTick (live price for trigger evaluation)
- Socket.IO

## 6. API endpoints
- `POST /api/trades/target-sl`
- `POST /api/trades/modify-pending`
- `POST /api/paper/gtt` (paper)

## 7. Authentication/authorization dependencies
- Valid JWT.
- Transaction password.
- Hold-time rules.

## 8. Important business logic
- Target must be > entry for BUY and < entry for SELL (and vice versa for SL).
- `targetSLService` monitors live prices and triggers close when target or SL is hit.
- Bracket/cover order logic may create pending target/SL legs from a single entry.
- Paper trading has its own GTT trigger table.

## 9. External dependencies
- Continuous live price feed.
- MySQL `trades` table.

## 10. Potential risks/dependencies between modules
- Race with manual close and target/SL triggers.
- Validation rules duplicated across clients and backend.
- Target/SL prices can be set too close to entry and trigger immediately.

## 11. What should be handled by a dedicated coding agent
A **Trading-Engine Agent** should own target/SL validation, trigger monitoring, and bracket order logic.
