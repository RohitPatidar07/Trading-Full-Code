# Feature: Authentication & Session Management

## 1. Feature name
Authentication & Session Management

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/LoginPage.jsx`
- `Trading_Frontend-main/src/context/AuthContext.jsx`
- `Trading_Frontend-main/src/components/ProtectedRoute.jsx`
- `Trading_Frontend-main/src/hooks/useInactivityLogout.js`
- `Trading_Frontend-main/src/utils/api.js`
- `Trading_Frontend-main/src/services/authService.js`
- `Trading_Webview-main/src/pages/AuthPages.jsx`
- `Trading_Webview-main/src/services/api.js`
- `Trading_Webview-main/src/App.jsx`
- `trading-updated-apk-main/src/screens/auth/LoginScreen.js`
- `trading-updated-apk-main/src/screens/auth/ChangePasswordScreen.js`
- `trading-updated-apk-main/src/services/api.js`
- `trading-updated-apk-main/src/hooks/useInactivityLogout.js`
- `trading-updated-apk-main/App.js`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/middleware/auth.js`
- `sharemarket-aws-backend-master/src/controllers/authController.js`
- `sharemarket-aws-backend-master/src/routes/authRoutes.js`
- `sharemarket-aws-backend-master/src/controllers/userController.js` (session invalidation, status)
- `sharemarket-aws-backend-master/src/controllers/securityController.js` (login history, risk score)

## 4. Database tables/models involved
- `users` — credentials, role, status, session_token, last_reset_at
- `login_history` / `ip_logins` / `ip_logs` — audit trail
- `otp_logs` — OTP attempts (if enabled)

## 5. Third-party APIs/services involved
- ipify.org (client public IP capture)
- bcrypt (password hashing)
- jsonwebtoken (JWT)
- otplib (TOTP for Kite auto-login)

## 6. API endpoints
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/create-user`
- `POST /api/auth/transaction-password`
- `GET /api/auth/me` (implied from mobile)
- `POST /api/auth/change-password` (mobile)

## 7. Authentication/authorization dependencies
- JWT issued on login; stored in `localStorage`/`sessionStorage` on web, in-memory module object on mobile.
- `authMiddleware` validates JWT and attaches `req.user`.
- Single active `TRADER` session enforced via `session_token`.
- Role checks: `SUPERADMIN`, `ADMIN`, `BROKER`, `TRADER`.

## 8. Important business logic
- `TRADER` role gets a single active session; logging in elsewhere invalidates the previous token.
- `ADMIN`/`BROKER`/`SUPERADMIN` can have multiple sessions currently.
- Transaction password is separate from login password and required for trades/funds.
- Inactivity logout after 10 minutes across clients.
- Mobile rejects non-`TRADER` roles at login.

## 9. External dependencies
- Backend depends on `jsonwebtoken`, `bcryptjs`, `otplib`.
- Clients depend on browser `localStorage`/`sessionStorage` or React Native module-level storage.

## 10. Potential risks/dependencies between modules
- JWT in `localStorage` is vulnerable to XSS theft.
- Mobile stores token only in memory — lost on app kill.
- WebView sign-up calls a hardcoded Railway backend instead of the configured backend.
- `Trading_Frontend-main/.env` is tracked in Git.
- Hardcoded dev credentials exist in `LoginPage.jsx`.
- Committed broker session in `src/data/kite_session.json`.

## 11. What should be handled by a dedicated coding agent
A dedicated **Auth & Security Agent** should own login/session/JWT/roles/permissions/route guards/password policies/IP audit across all modules.
