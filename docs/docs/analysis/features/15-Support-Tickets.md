# Feature: Support Tickets

## 1. Feature name
Support Tickets & Chat

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/support/RaiseTicketPage.jsx`
- `Trading_Webview-main/src/pages/Account.jsx` (support section)
- `trading-updated-apk-main/src/screens/others/SupportScreen.js`
- `trading-updated-apk-main/src/screens/others/TicketChatScreen.js`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/supportController.js`
- `sharemarket-aws-backend-master/src/routes/supportRoutes.js`
- `sharemarket-aws-backend-master/src/config/socket.js` (real-time message emit)

## 4. Database tables/models involved
- `support_tickets`
- `ticket_messages`
- `ticket_read_status`
- `users`

## 5. Third-party APIs/services involved
- Socket.IO (real-time chat messages)
- Brevo/SMTP (email notifications per docs)

## 6. API endpoints
- `GET/POST /api/support/tickets`
- `POST /api/support/tickets/:id/messages`
- `POST /api/support/tickets/:id/read`

## 7. Authentication/authorization dependencies
- Valid JWT.
- Users see their own tickets; admins see all.

## 8. Important business logic
- Users raise tickets with subject/message.
- Admins and users can reply; messages stored in `ticket_messages`.
- `ticket_read_status` tracks last read per user.
- Real-time message delivery via Socket.IO.
- Mobile `ContactUsScreen` submits to `/contact` endpoint.

## 9. External dependencies
- MySQL support tables.
- Socket.IO for chat.

## 10. Potential risks/dependencies between modules
- Mobile `ContactUsScreen` swallows errors and shows false success.
- WebView/mobile support chat relies on Socket.IO delivery; fallback polling may be needed.

## 11. What should be handled by a dedicated coding agent
A **Backend-Platform Agent** should own ticket/message APIs; client agents own respective UI screens.
