# Feature: Real-time Notifications & Alerts

## 1. Feature name
Real-time Notifications & Alerts

## 2. Related frontend files
- `Trading_Frontend-main/src/components/TopBar.jsx`
- `Trading_Frontend-main/src/pages/notifications/NotificationsPage.jsx`
- `Trading_Frontend-main/src/pages/notifications/UserNotificationsPage.jsx`
- `Trading_Frontend-main/src/hooks/useNotifications.js`
- `Trading_Webview-main/src/context/TradeContext.jsx` (notification/alert section)
- `Trading_Webview-main/src/pages/Dashboard.jsx`
- `trading-updated-apk-main/src/context/TradeContext.js` (notification/alert section)
- `trading-updated-apk-main/src/screens/others/NotificationsScreen.js`
- `trading-updated-apk-main/src/screens/others/AlertsScreen.js`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/notificationController.js`
- `sharemarket-aws-backend-master/src/routes/notificationRoutes.js`
- `sharemarket-aws-backend-master/src/controllers/alertController.js`
- `sharemarket-aws-backend-master/src/routes/alertRoutes.js`
- `sharemarket-aws-backend-master/src/services/alertMonitoringService.js`
- `sharemarket-aws-backend-master/src/services/alertMonitorService.js`
- `sharemarket-aws-backend-master/src/config/socket.js`

## 4. Database tables/models involved
- `notifications`
- `notification_reads`
- `alerts`
- `user_alert_settings`
- `tickers` (admin scrolling messages)

## 5. Third-party APIs/services involved
- Socket.IO (real-time emit)
- Brevo/SMTP (email notifications, if used)
- WhatsApp/SMS providers (Twilio/Msg91 per docs, backend-driven)

## 6. API endpoints
- `GET/POST /api/notifications`
- `GET/POST /api/alerts`
- `GET/POST /api/alerts/settings`
- `GET/POST /api/system/tickers`
- `POST /api/signals/broadcast`

## 7. Authentication/authorization dependencies
- Valid JWT.
- Admin can send targeted/role-based notifications.

## 8. Important business logic
- Notifications can target a user, role, or list of users.
- `notification_reads` tracks read status.
- Price alerts trigger when LTP crosses above/below threshold.
- Alert monitor evaluates live prices and emits `alert_triggered` via Socket.IO.
- Admin ticker messages scroll in client ticker tapes.
- Signals broadcast to selected users.

## 9. External dependencies
- Socket.IO for real-time delivery.
- Email/SMS providers configured in backend.

## 10. Potential risks/dependencies between modules
- Alert monitor depends on Market Data price feed.
- Notification emit depends on Socket.IO connection state.
- Duplicate alert service files (`alertMonitoringService.js` and `alertMonitorService.js`) may cause confusion.

## 11. What should be handled by a dedicated coding agent
A **Backend-Platform Agent** should own notification/alert CRUD and emit logic; a **Market Data Agent** should own price-trigger evaluation.
