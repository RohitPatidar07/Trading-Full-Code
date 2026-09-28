# Feature: KYC & Documents

## 1. Feature name
KYC & Document Verification

## 2. Related frontend files
- `Trading_Frontend-main/src/pages/clients/KycUploadPage.jsx`
- `Trading_Frontend-main/src/pages/clients/TradingClientsPage.jsx` (KYC status)
- `Trading_Frontend-main/src/components/ClientDetailsForm.jsx`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/userController.js` (document upload)
- `sharemarket-aws-backend-master/src/routes/userRoutes.js`
- `sharemarket-aws-backend-master/src/config/imagekit.js`

## 4. Database tables/models involved
- `user_documents`
- `users` (KYC status linkage)

## 5. Third-party APIs/services involved
- ImageKit (document/image upload)

## 6. API endpoints
- `POST /api/users/documents`
- `GET /api/users/:id` (KYC status)
- `PATCH /api/users/:id` (status update)

## 7. Authentication/authorization dependencies
- Valid JWT.
- Admin/broker can verify/reject KYC.
- Trader can upload own documents.

## 8. Important business logic
- Documents include PAN, Aadhar, bank proof.
- `kyc_status`: `PENDING | VERIFIED | REJECTED`.
- Uploads go to ImageKit with local `/uploads` fallback.
- KYC verification may gate trading or fund withdrawals.

## 9. External dependencies
- ImageKit.
- MySQL `user_documents`.

## 10. Potential risks/dependencies between modules
- Sensitive PII in uploaded documents.
- Local fallback `/uploads` is served statically without auth.
- KYC status affects client onboarding and fund flows.

## 11. What should be handled by a dedicated coding agent
A **Backend-Platform Agent** should own KYC upload and verification workflow; a **Client Management Agent** should own UI forms.
