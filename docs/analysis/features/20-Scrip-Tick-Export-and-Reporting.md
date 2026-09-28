# Feature: Scrip Tick Export & Reporting

## 1. Feature name
Scrip Tick Export & Reporting

## 2. Related frontend files
- `Trading_Frontend-main/src/components/DashboardFilters.jsx` (PDF/Excel export)
- `Trading_Frontend-main/src/pages/clients/TradingClientsPage.jsx` (Excel export)
- `Trading_Frontend-main/src/pages/logs/ActionLedgerPage.jsx` (CSV export)

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/scripTickController.js`
- `sharemarket-aws-backend-master/src/routes/scripTickRoutes.js`
- `sharemarket-aws-backend-master/src/workers/s3ExportWorker.js`
- `sharemarket-aws-backend-master/src/workers/pdfExportWorker.js`
- `sharemarket-aws-backend-master/src/controllers/dashboardController.js`
- `sharemarket-aws-backend-master/src/controllers/securityController.js` (audit reports)

## 4. Database tables/models involved
- `scrip_ticks_history`
- `trades`
- `ledger`
- `weekly_settlements`
- `action_ledger`
- `ip_logins` / `ip_logs`

## 5. Third-party APIs/services involved
- AWS S3 (tick export)
- PDFKit (PDF generation)
- jsPDF / xlsx (frontend export)

## 6. API endpoints
- `GET /api/scrip-ticks`
- `GET /api/scrip-ticks/history`
- `GET /api/scrip-ticks/export-pdf`
- `POST /api/scrip-ticks/export-s3`
- `DELETE /api/scrip-ticks/purge`
- `GET /api/system/audit-log`
- `GET /api/security/ip-clusters`
- `GET /api/security/trade-ip-audit`

## 7. Authentication/authorization dependencies
- Valid JWT.
- Admin/broker for export/purge/audit reports.

## 8. Important business logic
- Tick history can be exported to PDF or uploaded to S3.
- Purge removes old ticks to manage storage.
- Reports include trade book, ledger, settlements, audit logs, IP forensics.
- Worker processes handle large exports asynchronously.

## 9. External dependencies
- AWS S3 credentials.
- PDFKit / jsPDF / xlsx libraries.
- MySQL reporting queries.

## 10. Potential risks/dependencies between modules
- Large `scrip_ticks_history` purges can be slow; consider partitioning.
- S3 export worker uses template-literal SQL with `parseInt` — review for safety.
- Audit logs and IP reports must not leak sensitive PII.

## 11. What should be handled by a dedicated coding agent
A **Backend-Platform Agent** should own export workers and report endpoints; a **Database Agent** should optimize reporting queries and tick retention.
