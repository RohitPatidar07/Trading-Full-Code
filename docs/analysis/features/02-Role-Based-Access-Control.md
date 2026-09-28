# Feature: Role-Based Access Control (RBAC)

## 1. Feature name
Role-Based Access Control (RBAC) & Menu Permissions

## 2. Related frontend files
- `Trading_Frontend-main/src/context/AuthContext.jsx`
- `Trading_Frontend-main/src/components/Sidebar.jsx`
- `Trading_Frontend-main/src/components/ProtectedRoute.jsx`
- `Trading_Frontend-main/src/hooks/useBrokerPermissions.js`
- `Trading_Frontend-main/src/App.jsx` (route table)
- `Trading_Webview-main/src/App.jsx` (basic guard)
- `trading-updated-apk-main/src/navigation/AppNavigator.js`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/middleware/auth.js`
- `sharemarket-aws-backend-master/src/controllers/adminController.js`
- `sharemarket-aws-backend-master/src/routes/adminRoutes.js`
- `sharemarket-aws-backend-master/src/controllers/userController.js`

## 4. Database tables/models involved
- `users` — role, status, parent_id hierarchy
- `admin_menu_permissions` — per-user admin menu access
- `admin_panel_settings` — theming
- `broker_shares` — broker-specific permissions and limits

## 5. Third-party APIs/services involved
- None directly.

## 6. API endpoints
- `GET/POST /api/admin/menu-permissions`
- `GET/POST /api/admin/panel-theme`
- `POST /api/admin/init`
- `GET /api/accounts/hierarchy`

## 7. Authentication/authorization dependencies
- Depends on Authentication & Session Management.
- `authMiddleware` validates JWT.
- Role middleware (`requireRole`, broker permission checks) gates routes.
- `canAccess(menuId)` in frontend filters sidebar and routes.

## 8. Important business logic
- Roles: `SUPERADMIN`, `ADMIN`, `BROKER`, `TRADER`.
- User hierarchy via `parent_id` (superadmin → admin → broker → trader).
- Admin menus are fetched from `/api/admin/init` and stored in `sessionStorage`.
- Broker permissions include `subBrokerActions`, `payinAllowed`, `payoutAllowed`, `createClientsAllowed`, `clientTasksAllowed`, `tradeActivityAllowed`, `notificationsAllowed`, `canViewBackupData`.
- WebView and mobile have minimal RBAC beyond the route guard.

## 9. External dependencies
- Backend `jsonwebtoken` for identity.
- Frontend `sessionStorage` for cached permissions.

## 10. Potential risks/dependencies between modules
- Frontend and backend permission logic can drift.
- `TRADER` single-session logic is in auth middleware; changes affect RBAC enforcement.
- Broker permission checks duplicated between backend and frontend.
- Menu permission arrays are hardcoded as fallback in `AuthContext.jsx`.

## 11. What should be handled by a dedicated coding agent
An **Auth & Security Agent** should centralize RBAC, menu permissions, and broker permission logic.
