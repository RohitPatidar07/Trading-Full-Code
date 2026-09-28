# Feature: Trade Close, Exit & Order Lifecycle

## 1. Feature name
Trade Close, Exit & Order Lifecycle

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/trades/ActiveTradesPage.jsx`
- `Trading_Frontend-main/src/pages/trades/TradeDetailPage.jsx`
- `Trading_Frontend-main/src/pages/trades/DeleteTradePage.jsx`
- `Trading_Frontend-main/src/pages/trades/RestoreBuyPage.jsx`
- `Trading_Webview-main/src/pages/Trades.jsx`
- `Trading_Webview-main/src/pages/Portfolio.jsx`
- `trading-updated-apk-main/src/screens/others/ExitTradeScreen.js`
- `trading-updated-apk-main/src/screens/tabs/TradesScreen.js`
- `trading-updated-apk-main/src/screens/tabs/PortfolioScreen.js`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/tradeController.js`
- `sharemarket-aws-backend-master/src/services/TradeService.js`
- `sharemarket-aws-backend-master/src/services/RMSService.js` (auto close)
- `sharemarket-aws-backend-master/src/services/targetSLService.js` (target/SL close)

## 4. Database tables/models involved
- `trades` (status transitions: OPEN → CLOSED/SETTLED/DELETED)
- `ledger` (realized P&L, brokerage, swap)
- `weekly_settlement_items` (if close happens during settlement)

## 5. Third-party APIs/services involved
- Zerodha Kite / AllTick (exit price reference)
- Socket.IO (trade update notifications)

## 6. API endpoints
- `POST /api/trades/close`
- `DELETE /api/trades/:id`
- `POST /api/trades/restore`
- `POST /api/trades/target-sl`

## 7. Authentication/authorization dependencies
- Valid JWT.
- Transaction password for close/exit.
- Hold-time enforcement from `client_settings`.

## 8. Important business logic
- Close can be full or partial.
- Exit price selection (LTP/bid/ask based on side).
- Realized P&L and brokerage written to `ledger`.
- Deleted trades are soft-deleted and can be restored by admin.
- `closed_by` field tracks whether close was manual, RMS, target, SL, or settlement.
- Hold-time check prevents scalping (`min_time_to_book_profit`).

## 9. External dependencies
- Live price feed for exit pricing.
- MySQL `trades` and `ledger`.

## 10. Potential risks/dependencies between modules
- Race conditions between manual close and RMS/target-SL auto close.
- Partial close logic must correctly split trade quantities and P&L.
- Deleted trade restore must recalculate balances correctly.
- WebView `closeTrade` uses raw `fetch` without timeout.

## 11. What should be handled by a dedicated coding agent
A **Trading-Engine Agent** should own the full order lifecycle: place → modify → close → delete → restore.
