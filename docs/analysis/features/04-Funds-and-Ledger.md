# Feature: Funds & Ledger Management

## 1. Feature name
Funds & Ledger Management

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/funds/TraderFundsPage.jsx`
- `Trading_Frontend-main/src/pages/funds/FundDetailPage.jsx`
- `Trading_Frontend-main/src/components/CreateFundForm.jsx`
- `Trading_Frontend-main/src/pages/portfolio/PortfolioPage.jsx` (if exists)
- `Trading_Webview-main/src/pages/Account.jsx` (funds section)
- `Trading_Webview-main/src/services/api.js`
- `trading-updated-apk-main/src/screens/others/FundsScreen.js`
- `trading-updated-apk-main/src/screens/tabs/PortfolioScreen.js` (ledger display)

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/fundController.js`
- `sharemarket-aws-backend-master/src/routes/fundRoutes.js`
- `sharemarket-aws-backend-master/src/controllers/portfolioController.js`
- `sharemarket-aws-backend-master/src/routes/portfolioRoutes.js`
- `sharemarket-aws-backend-master/src/controllers/requestController.js`
- `sharemarket-aws-backend-master/src/routes/requestRoutes.js`
- `sharemarket-aws-backend-master/src/services/TradeService.js` (brokerage/swap ledger writes)
- `sharemarket-aws-backend-master/src/services/WeeklySettlementService.js` (settlement ledger writes)

## 4. Database tables/models involved
- `ledger` — immutable journal of all money movements
- `users` — current wallet balance (`balance`)
- `payment_requests` — pending deposit/withdrawal requests
- `internal_transfers` — user-to-user transfers
- `brokerage_logs` — per-trade brokerage
- `weekly_settlements` / `weekly_settlement_items` — settlement postings

## 5. Third-party APIs/services involved
- ImageKit (deposit screenshot upload)
- Brevo/SMTP (email notifications)

## 6. API endpoints
- `POST /api/funds/deposit`
- `POST /api/funds/withdraw`
- `GET /api/funds/withdrawable-balance`
- `POST /api/funds/upload`
- `GET /api/portfolio/balance`
- `GET /api/portfolio/ledger`
- `POST /api/portfolio/internal-transfer`
- `GET /api/requests`
- `POST /api/requests/:id/approve`
- `POST /api/requests/:id/reject`

## 7. Authentication/authorization dependencies
- Valid JWT.
- Transaction password for withdrawals/funds movement.
- Role checks for approving/rejecting requests (`ADMIN`, `BROKER`).

## 8. Important business logic
- Every rupee movement must produce a balanced `ledger` entry.
- `users.balance` is a snapshot; `ledger` is the source of truth.
- Withdrawable balance calculation must account for open margins and pending requests.
- Internal transfers move balance between users with ledger entries for both sides.
- Deposit/withdrawal requests require admin approval before ledger entry.

## 9. External dependencies
- ImageKit upload for deposit proof.
- MySQL `ledger`, `payment_requests`, `users` tables.

## 10. Potential risks/dependencies between modules
- Ledger imbalance if deposit/withdrawal approval logic has bugs.
- `withdrawable-balance` must be consistent with Trading-Engine margin calculations.
- Weekly settlement writes to `ledger`; bugs corrupt balances.
- Trade close writes P&L and brokerage to `ledger`.

## 11. What should be handled by a dedicated coding agent
A dedicated **Trading-Engine Agent** (or **Backend-Platform Agent**) should own ledger correctness, fund flows, and internal transfers, coordinating tightly with the Database Agent.
