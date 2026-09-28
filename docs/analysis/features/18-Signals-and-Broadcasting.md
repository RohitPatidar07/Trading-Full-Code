# Feature: Signals & Broadcasting

## 1. Feature name
Trading Signals & Broadcasting

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/trades/SignalsPage.jsx`
- `Trading_Frontend-main/src/pages/trades/SignalAdminPage.jsx`
- `Trading_Frontend-main/src/components/dashboard/SignalFeed.jsx`
- `Trading_Webview-main/src/context/TradeContext.jsx` (signal handling if present)

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/signalController.js`
- `sharemarket-aws-backend-master/src/routes/signalRoutes.js`
- `sharemarket-aws-backend-master/src/controllers/notificationController.js` (emit)
- `sharemarket-aws-backend-master/src/config/socket.js`

## 4. Database tables/models involved
- `signals`
- `notifications`
- `notification_reads`

## 5. Third-party APIs/services involved
- Socket.IO (real-time broadcast)
- Brevo/SMTP / WhatsApp/SMS (per docs, optional)

## 6. API endpoints
- `POST /api/signals/broadcast`
- `GET/POST /api/notifications`

## 7. Authentication/authorization dependencies
- Valid JWT.
- Only `ADMIN`/`SUPERADMIN`/`BROKER` can broadcast signals.

## 8. Important business logic
- Admin publishes a signal (symbol, action, target, SL, etc.).
- Signal is broadcast to selected users or roles via Socket.IO.
- Stored in `signals` table for history.
- May also generate a notification.

## 9. External dependencies
- Socket.IO for delivery.
- MySQL `signals` table.

## 10. Potential risks/dependencies between modules
- Depends on Socket.IO connection state for real-time delivery.
- Signal data format must be consistent across admin and client UIs.

## 11. What should be handled by a dedicated coding agent
A **Backend-Platform Agent** should own signal CRUD and broadcast; client agents own signal display UI.
