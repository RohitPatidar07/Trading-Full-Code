# Feature: User / Client / Broker / Admin Management

## 1. Feature name
User, Client, Broker & Admin Management

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/clients/*`
- `Trading_Frontend-main/src/pages/brokers/*`
- `Trading_Frontend-main/src/pages/users/*`
- `Trading_Frontend-main/src/components/ClientDetailsForm.jsx`
- `Trading_Frontend-main/src/components/SimpleTraderForm.jsx`
- `Trading_Frontend-main/src/components/SimpleAddUserForm.jsx`
- `Trading_Frontend-main/src/components/AddBrokerForm.jsx`
- `Trading_Frontend-main/src/pages/bank/BankDetailsPage.jsx`
- `Trading_Frontend-main/src/pages/bank/NewClientBankDetailsPage.jsx`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/userController.js`
- `sharemarket-aws-backend-master/src/routes/userRoutes.js`
- `sharemarket-aws-backend-master/src/controllers/bankController.js`
- `sharemarket-aws-backend-master/src/routes/bankRoutes.js`
- `sharemarket-aws-backend-master/src/routes/newClientBankRoutes.js`
- `sharemarket-aws-backend-master/src/controllers/accountController.js`
- `sharemarket-aws-backend-master/src/routes/accountRoutes.js`

## 4. Database tables/models involved
- `users` — core accounts, hierarchy, balances
- `user_segments` — per-user segment config
- `broker_shares` — broker revenue sharing and limits
- `client_settings` — per-trader risk settings
- `bank_details` / `new_client_bank` — bank accounts
- `user_documents` — KYC docs
- `internal_transfers` — fund transfers between users

## 5. Third-party APIs/services involved
- ImageKit (KYC document / profile image upload)

## 6. API endpoints
- `GET/POST/PATCH/DELETE /api/users`
- `GET/POST /api/users/settings`
- `GET/POST /api/users/segments`
- `GET/POST /api/users/watchlist`
- `POST /api/users/reset-account`
- `POST /api/users/recalc-brokerage`
- `POST /api/users/documents`
- `GET/POST /api/banks`
- `GET/POST /api/new-client-banks`
- `GET /api/accounts/hierarchy`
- `POST /api/portfolio/internal-transfer`

## 7. Authentication/authorization dependencies
- Requires valid JWT and appropriate role (`ADMIN`, `BROKER`, `SUPERADMIN`).
- Broker can manage only clients under their hierarchy.
- `canAccess` menu permission gates frontend pages.

## 8. Important business logic
- User hierarchy determines who can manage whom.
- `status` toggle (Active/Inactive/Suspended) controls login ability.
- `credit_limit`, `exposure_multiplier`, `is_demo` affect trading.
- Per-user segment config controls which markets a trader can access.
- Broker shares configure profit/brokerage/swap sharing.
- Internal transfers move ledger balance between users.

## 9. External dependencies
- ImageKit SDK for uploads.
- MySQL `users`, `user_segments`, `broker_shares` tables.

## 10. Potential risks/dependencies between modules
- Mass-assignment risk in `updateUser` (can update `status`, `parentId`, `creditLimit`, `isDemo`).
- `deleteUser` cascades without hierarchy verification beyond role check.
- Client settings affect Trading-Engine (hold-time, scalping, auto square-off).
- Bank details are used by Deposit/Withdrawal and Fund features.

## 11. What should be handled by a dedicated coding agent
A dedicated **Client Management Agent** (or **Backend-Platform Agent**) should own user CRUD, KYC, bank details, segment config, broker shares, and internal transfers.
