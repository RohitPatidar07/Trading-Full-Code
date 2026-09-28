# Feature: Deposit & Withdrawal Requests

## 1. Feature name
Deposit & Withdrawal Requests

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/requests/DepositRequestsPage.jsx`
- `Trading_Frontend-main/src/pages/requests/WithdrawalRequestsPage.jsx`
- `Trading_Frontend-main/src/components/CreateFundForm.jsx`
- `Trading_Webview-main/src/pages/Account.jsx` (deposit/withdraw sections)
- `trading-updated-apk-main/src/screens/others/DepositRequestScreen.js`
- `trading-updated-apk-main/src/screens/others/WithdrawalRequestScreen.js`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/fundController.js`
- `sharemarket-aws-backend-master/src/controllers/requestController.js`
- `sharemarket-aws-backend-master/src/routes/fundRoutes.js`
- `sharemarket-aws-backend-master/src/routes/requestRoutes.js`
- `sharemarket-aws-backend-master/src/config/imagekit.js`

## 4. Database tables/models involved
- `payment_requests`
- `ledger`
- `users` (balance)
- `bank_details` / `new_client_bank`

## 5. Third-party APIs/services involved
- ImageKit (deposit screenshot upload)
- Brevo/SMTP (status notification emails)

## 6. API endpoints
- `POST /api/funds/deposit`
- `POST /api/funds/withdraw`
- `POST /api/funds/upload`
- `GET /api/requests`
- `POST /api/requests/:id/approve`
- `POST /api/requests/:id/reject`

## 7. Authentication/authorization dependencies
- Valid JWT.
- `TRADER` can create requests.
- `ADMIN`/`BROKER`/`SUPERADMIN` can approve/reject.
- Transaction password for withdrawals.

## 8. Important business logic
- Deposit request may include an ImageKit screenshot proof.
- Withdrawal request captures bank/UPI details and amount.
- Admin approval creates a `ledger` entry and updates `users.balance`.
- Rejection updates request status without ledger impact.
- Withdrawal amount cannot exceed withdrawable balance.

## 9. External dependencies
- ImageKit upload.
- MySQL `payment_requests` and `ledger` tables.

## 10. Potential risks/dependencies between modules
- Race condition if balance changes between request creation and approval.
- Inconsistent bank/UPI validation across clients.
- Mobile `WithdrawalRequestScreen` displays full bank account numbers and UPI IDs without masking.
- WebView `ContactUsScreen` swallows errors and shows false success (mobile only).

## 11. What should be handled by a dedicated coding agent
A **Backend-Platform Agent** should own the request workflow; a **Trading-Engine Agent** should own ledger correctness on approval.
