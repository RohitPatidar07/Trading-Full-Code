# Feature: Margin, RMS & Risk Management

## 1. Feature name
Margin, RMS & Risk Management

## 2. Related frontend files
- `Trading_Frontend-main/src/utils/segmentMargin.js`
- `Trading_Frontend-main/src/pages/dashboard/LiveM2MPage.jsx`
- `Trading_Frontend-main/src/pages/dashboard/BrokerM2MPage.jsx`
- `Trading_Webview-main/src/pages/Portfolio.jsx`
- `Trading_Webview-main/src/utils/segmentMargin.js`
- `trading-updated-apk-main/src/utils/segmentMargin.js`
- `trading-updated-apk-main/src/screens/tabs/PortfolioScreen.js`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/services/RMSService.js`
- `sharemarket-aws-backend-master/src/controllers/marginController.js`
- `sharemarket-aws-backend-master/src/routes/marginRoutes.js`
- `sharemarket-aws-backend-master/src/services/TradeService.js`
- `sharemarket-aws-backend-master/src/utils/segmentMargin.js`
- `sharemarket-aws-backend-master/src/controllers/dashboardController.js`

## 4. Database tables/models involved
- `trades` (margin_used, leverage_used, status)
- `user_segments` (margin_type, leverage, exposure_multiplier)
- `client_settings` (auto_close_at_m2m_pct, notify_at_m2m_pct)
- `broker_shares` (sharing)
- `scrip_data` (margin_req, lot_size)
- `users` (balance, credit_limit)

## 5. Third-party APIs/services involved
- Zerodha Kite / AllTick (live prices for M2M)
- Socket.IO

## 6. API endpoints
- `GET/POST /api/margins/config`
- `POST /api/margins/validate`
- `GET /api/margins/calculate`
- `GET /api/dashboard/m2m`
- `GET /api/dashboard/broker-m2m`
- `GET /api/accounts/negative-balance-alerts`

## 7. Authentication/authorization dependencies
- Valid JWT.
- Role-based access to M2M dashboards.

## 8. Important business logic
- Margin calculation is segment-specific: per lot, percentage, fixed, or exposure-based.
- `margin_used` is recorded per trade at entry.
- RMS monitors M2M loss against `auto_close_at_m2m_pct` and auto square-offs positions.
- Negative balance alerts for accounts exceeding limits.
- Broker M2M aggregates traders under a broker.

## 9. External dependencies
- Live price feed for real-time M2M.
- MySQL `trades`, `user_segments`, `client_settings`.

## 10. Potential risks/dependencies between modules
- RMS can force-close user positions — incorrect thresholds have financial impact.
- Margin calc duplicated across backend and clients must match.
- `client_settings` changes directly affect RMS behavior.
- No input validation library; dynamic SQL in some margin queries.

## 11. What should be handled by a dedicated coding agent
A **Trading-Engine Agent** should own margin calculation, RMS thresholds, M2M dashboards, and risk rules.
