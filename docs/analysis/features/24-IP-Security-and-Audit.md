# Feature: IP Security & Audit

## 1. Feature name
IP Security & Audit

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/logs/IpLoginsPage.jsx`
- `Trading_Frontend-main/src/pages/logs/TradeIpTrackingPage.jsx`
- `Trading_Frontend-main/src/utils/api.js` (ipify call)
- `Trading_Webview-main/src/services/api.js` (ipify call)
- `trading-updated-apk-main/src/services/api.js` (ipify call)

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/securityController.js`
- `sharemarket-aws-backend-master/src/routes/securityRoutes.js`
- `sharemarket-aws-backend-master/src/controllers/authController.js` (login history)
- `sharemarket-aws-backend-master/src/middleware/auth.js` / `logger.js`

## 4. Database tables/models involved
- `ip_logins`
- `ip_logs`
- `login_history`
- `action_ledger`
- `trades` (`close_ip`)

## 5. Third-party APIs/services involved
- ipify.org (client public IP)

## 6. API endpoints
- `GET /api/security/ip-clusters`
- `GET /api/security/trade-ip-audit`
- `GET /api/security/risk-score`
- `GET /api/security/login-history`

## 7. Authentication/authorization dependencies
- Valid JWT.
- Admin/broker for IP audit and risk score views.

## 8. Important business logic
- Captures client public IP on login and trade actions.
- IP clusters detect multiple accounts from same IP.
- Trade IP audit links trades to source IP.
- Risk score computed per user based on login/trade behavior.
- `action_ledger` records admin actions for forensics.

## 9. External dependencies
- ipify.org.
- MySQL audit tables.

## 10. Potential risks/dependencies between modules
- ipify dependency introduces third-party privacy leak.
- IP data must be handled per privacy regulations.
- Risk-score changes may affect user access.

## 11. What should be handled by a dedicated coding agent
An **Auth & Security Agent** should own IP logging, risk scoring, audit trails, and forensics.
