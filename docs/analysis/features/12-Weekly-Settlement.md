# Feature: Weekly Settlement

## 1. Feature name
Weekly Settlement

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/admin/GlobalUpdationPage.jsx` (if settlement-related)
- `Trading_Frontend-main/src/pages/clients/TradingClientsPage.jsx` (settlement history)
- Admin settlement UI pages (if present)

## 3. Related backend files
- `sharemarket-aws-backend-master/src/services/WeeklySettlementService.js`
- `sharemarket-aws-backend-master/src/controllers/weeklySettlementController.js`
- `sharemarket-aws-backend-master/src/routes/weeklySettlementRoutes.js`
- `sharemarket-aws-backend-master/src/controllers/adminController.js` (`/admin/weekly-settlement`)

## 4. Database tables/models involved
- `weekly_settlements`
- `weekly_settlement_items`
- `weekly_balances`
- `trades` (status, settlement_id, is_carried_forward)
- `ledger` (settlement postings)
- `users` (balance)

## 5. Third-party APIs/services involved
- None directly.

## 6. API endpoints
- `POST /api/weekly-settlement/run`
- `GET /api/weekly-settlement/history`
- `GET/POST /api/weekly-settlement/config`
- `POST /api/weekly-settlement/reset-id`
- `POST /api/admin/weekly-settlement`

## 7. Authentication/authorization dependencies
- Valid JWT.
- `ADMIN`/`SUPERADMIN` only.

## 8. Important business logic
- Runs at configured weekly interval (`expiry_rules`).
- Aggregates realized P&L, brokerage, deposits, withdrawals per user.
- Determines which open trades to settle vs carry forward (`is_carried_forward`).
- Writes settlement summary to `weekly_settlements` and line items to `weekly_settlement_items`.
- Updates `ledger` and `users.balance`.
- `reset-id` logic tracks `last_reset_at`.

## 9. External dependencies
- MySQL settlement tables and `trades`/`ledger`.

## 10. Potential risks/dependencies between modules
- Bugs here corrupt user balances and P&L history.
- Must be run only after trade/ledger logic is stable.
- Carry-forward trades affect next week's opening balance.
- Settlement interacts with RMS and target/SL auto-closes.

## 11. What should be handled by a dedicated coding agent
A **Trading-Engine Agent** should own weekly settlement logic, carry-forward rules, and settlement posting.
