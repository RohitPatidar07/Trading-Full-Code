# Third-Party Integration: Brevo / SMTP

## 1. API/service name
Brevo (Sendinblue) / SMTP

## 2. Purpose
Transactional emails (account alerts, ticket updates, notifications).

## 3. Which feature uses it
- Notifications & Alerts
- Support Tickets
- Deposit/Withdrawal status emails

## 4. Frontend files using it
- None directly (backend-driven).

## 5. Backend files using it
- Notification / support services
- Email helper utilities

## 6. SDK/package used
- `nodemailer`
- Brevo API (if used directly)

## 7. API endpoints/methods used
- SMTP `sendMail`
- Brevo transactional email API (if used)

## 8. Authentication method
- SMTP credentials or Brevo API key.

## 9. Webhooks
- Brevo may support delivery webhooks (not currently used).

## 10. WebSocket/realtime connection
- No.

## 11. Environment variables required
- `BREVO_API_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

## 12. Database dependencies
- `notifications`
- `support_tickets`
- `payment_requests`

## 13. Other features depending on it
- User communication
- Compliance/audit email trail

## 14. Complexity
Low

## 15. Risk if this integration is changed
- Emails stop sending silently.
- Users miss critical alerts.

## 16. Whether it deserves a dedicated specialist agent
No separate agent needed; include under **Backend-Platform Agent**.
