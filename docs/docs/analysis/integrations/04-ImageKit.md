# Third-Party Integration: ImageKit

## 1. API/service name
ImageKit

## 2. Purpose
Image and document uploads (KYC docs, deposit screenshots, profile images, admin logos).

## 3. Which feature uses it
- KYC & Documents
- Deposit Requests
- Admin Panel Theme/Logo
- User Profile Images

## 4. Frontend files using it
- `Trading_Frontend-main/src/pages/clients/KycUploadPage.jsx`
- `Trading_Frontend-main/src/components/CreateFundForm.jsx`
- `Trading_Frontend-main/src/pages/settings/ThemeSettingsPage.jsx`
- `Trading_Webview-main/src/pages/Account.jsx` (deposit screenshot)
- `trading-updated-apk-main/src/screens/others/DepositRequestScreen.js`

## 5. Backend files using it
- `sharemarket-aws-backend-master/src/config/imagekit.js`
- `sharemarket-aws-backend-master/src/controllers/fundController.js`
- `sharemarket-aws-backend-master/src/controllers/userController.js`
- `sharemarket-aws-backend-master/src/controllers/adminController.js`

## 6. SDK/package used
- `imagekit` (NPM SDK)
- `multer` (local upload fallback)

## 7. API endpoints/methods used
- Backend upload helper methods in `imagekit.js`
- `POST /api/funds/upload`
- `POST /api/users/documents`
- `POST /api/admin/panel-theme`

## 8. Authentication method
- Server-side public/private key pair.

## 9. Webhooks
- No.

## 10. WebSocket/realtime connection
- No.

## 11. Environment variables required
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_URL_ENDPOINT`

## 12. Database dependencies
- `user_documents`
- `payment_requests` (screenshot_url)
- `admin_panel_settings`

## 13. Other features depending on it
- KYC workflow
- Deposit/withdrawal proof
- Admin theming

## 14. Complexity
Medium

## 15. Risk if this integration is changed
- File uploads fail.
- Fallback local `/uploads` is served without auth — security gap.

## 16. Whether it deserves a dedicated specialist agent
No separate agent needed; include under **Backend-Platform Agent**.
