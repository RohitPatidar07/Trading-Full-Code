# Feature: Admin Panel & System Settings

## 1. Feature name
Admin Panel & System Settings

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/admin/*`
- `Trading_Frontend-main/src/pages/settings/*`
- `Trading_Frontend-main/src/pages/tickers/TickersPage.jsx`
- `Trading_Frontend-main/src/pages/banned/BannedLimitOrdersPage.jsx`
- `Trading_Frontend-main/src/pages/data/ScripDataPage.jsx`
- `Trading_Frontend-main/src/pages/logs/ActionLedgerPage.jsx`
- `Trading_Frontend-main/src/components/ThemeSettingsPage.jsx` / `GlobalSettingsPage.jsx`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/adminController.js`
- `sharemarket-aws-backend-master/src/routes/adminRoutes.js`
- `sharemarket-aws-backend-master/src/controllers/systemController.js`
- `sharemarket-aws-backend-master/src/routes/systemRoutes.js`
- `sharemarket-aws-backend-master/src/controllers/userController.js`

## 4. Database tables/models involved
- `admin_menu_permissions`
- `admin_panel_settings`
- `system_settings`
- `tickers`
- `banned_scrips` / `banned_limit_orders`
- `expiry_rules`
- `mcx_lot_sizes` / `commodity_forex_crypto_lot_sizes`
- `action_ledger`

## 5. Third-party APIs/services involved
- ImageKit (logo upload)
- AWS S3 (optional)

## 6. API endpoints
- `POST /api/admin/init`
- `GET/POST /api/admin/menu-permissions`
- `GET/POST /api/admin/panel-theme`
- `POST /api/admin/weekly-settlement`
- `GET/POST /api/system/mcx-lot-sizes`
- `GET/POST /api/system/banned-orders`
- `GET/POST /api/system/expiry-rules`
- `POST /api/system/sync-scrips`
- `GET /api/system/audit-log`

## 7. Authentication/authorization dependencies
- Valid JWT.
- `ADMIN`/`SUPERADMIN` role.
- Menu permission checks.

## 8. Important business logic
- Admin panel theme/logo upload.
- Menu permissions per admin user.
- Global settings: banned scrips, expiry rules, lot sizes, ticker messages.
- Audit log records admin actions.
- Sync scrips pulls instrument master from Kite.

## 9. External dependencies
- ImageKit for logo.
- Kite for sync-scrips.
- MySQL settings tables.

## 10. Potential risks/dependencies between modules
- System settings affect Trading-Engine (expiry, banned scrips, lot sizes).
- Theme/logo changes affect all clients.
- Audit log must be append-only and tamper-evident.

## 11. What should be handled by a dedicated coding agent
A **Backend-Platform Agent** should own admin/system APIs; a **Frontend-Web Agent** should own admin UI.
