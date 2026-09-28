# Third-Party Integration: AWS S3

## 1. API/service name
AWS S3

## 2. Purpose
Store exported scrip tick history files.

## 3. Which feature uses it
- Scrip Tick Export & Reporting

## 4. Frontend files using it
- Admin scrip-tick export UI (if any)

## 5. Backend files using it
- `sharemarket-aws-backend-master/src/workers/s3ExportWorker.js`
- `sharemarket-aws-backend-master/src/controllers/scripTickController.js`

## 6. SDK/package used
- `@aws-sdk/client-s3` (or `aws-sdk` v2)

## 7. API endpoints/methods used
- `PutObject` to upload CSV/PDF exports
- Backend endpoint: `POST /api/scrip-ticks/export-s3`

## 8. Authentication method
- AWS access key / secret key.

## 9. Webhooks
- No.

## 10. WebSocket/realtime connection
- No.

## 11. Environment variables required
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_BUCKET_NAME`

## 12. Database dependencies
- `scrip_ticks_history`
- `scrip_export_settings`

## 13. Other features depending on it
- Reporting / tick history archive

## 14. Complexity
Medium

## 15. Risk if this integration is changed
- Tick exports fail.
- Large queries may time out or consume excessive memory.
- AWS credentials must be rotated securely.

## 16. Whether it deserves a dedicated specialist agent
No separate agent needed; include under **Backend-Platform Agent**.
