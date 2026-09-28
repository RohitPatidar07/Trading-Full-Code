# Third-Party APIs & Integrations — Master Reference

This document consolidates every third-party API, service, SDK, and native integration used across the VTRKM trading platform.

It covers:

- Backend module: `sharemarket-aws-backend-master/`
- Frontend module: `Trading_Frontend-main/`
- WebView module: `Trading_Webview-main/`
- Mobile module: `trading-updated-apk-main/`

For detailed per-integration analysis, see `docs/analysis/integrations/`.

---

## Legend

- **Critical:** Core to platform operation; failure breaks major features.
- **High:** Important feature enabler; failure degrades experience significantly.
- **Medium:** Useful but replaceable or has fallback.
- **Low:** Cosmetic or minor utility.

---

## 1. Broker & Market Data Integrations

### 1.1 Zerodha Kite Connect

| Field | Details |
|-------|---------|
| **Purpose** | Indian market data (NSE, NFO, MCX), instrument master, live quotes, margins, holdings, positions, order placement. |
| **Features using it** | Market Data & Watchlists, Options Chain, MCX Futures Chain, Order Placement, Kite Dashboard, Contract Management, Paper Trading. |
| **Frontend files** | `Trading_Frontend-main/src/pages/dashboard/KiteDashboard.jsx`, `src/pages/market/MarketWatchPage.jsx`, `src/pages/market/OptionsChainTest.jsx`, `src/pages/market/McxFuturesChain.jsx`, `src/services/api.js`; `Trading_Webview-main/src/context/TradeContext.jsx`, `src/pages/Dashboard.jsx`; `trading-updated-apk-main/src/context/TradeContext.js`, `src/screens/tabs/DashboardScreen.js`. |
| **Backend files** | `sharemarket-aws-backend-master/src/routes/kiteRoutes.js`, `src/controllers/kiteController.js`, `src/services/KiteAuthService.js`, `src/services/MarketDataService.js`, `src/config/socket.js`, `src/data/kite_session.json`. |
| **SDK/package** | `kiteconnect`, `puppeteer`, native `ws`. |
| **API methods/endpoints** | `/api/kite/login`, `/api/kite/callback`, `/api/kite/set-token`, `/api/kite/status`, `/api/kite/margins`, `/api/kite/profile`, `/api/kite/market-dashboard`, `/api/kite/watchlist`, `/api/kite/instruments`, `/api/kite/quote`, `/api/kite/sync-instruments`; Kite SDK `generateSession`, `getProfile`, `getMargins`, `getHoldings`, `getPositions`, `getOrders`, `getInstruments`, `getQuote`, `getLTP`. |
| **Auth method** | OAuth2 + access token stored in `user_kite_sessions`. |
| **Webhooks** | Not currently used. |
| **WebSocket** | Yes — Kite Ticker relayed via backend Socket.IO. |
| **Env vars** | `KITE_API_KEY`, `KITE_API_SECRET`, `ZERODHA_USER_ID`, `ZERODHA_PASSWORD`, `ZERODHA_TOTP_SECRET`, `PUPPETEER_EXECUTABLE_PATH`. |
| **DB dependencies** | `user_kite_sessions`, `scrip_data`, `scrip_ticks_history`. |
| **Complexity** | Critical |
| **Risk if changed** | Live Indian market data and order flow stop. |
| **Dedicated agent?** | Yes — **Market-Data-Agent** / Kite specialist. |

### 1.2 AllTick

| Field | Details |
|-------|---------|
| **Purpose** | Crypto, forex, commodity market data via WebSocket/HTTP. |
| **Features using it** | Crypto/Forex/Commodity watchlist, Market Data Page. |
| **Frontend files** | `Trading_Frontend-main/src/pages/market/MarketDataPage.jsx`; `Trading_Webview-main/src/context/TradeContext.jsx`; `trading-updated-apk-main/src/context/TradeContext.js`. |
| **Backend files** | `sharemarket-aws-backend-master/src/services/allticks.service.js`, `src/services/MarketDataService.js`, `src/controllers/marketDataController.js`. |
| **SDK/package** | Native `ws` / `fetch`. |
| **API methods/endpoints** | AllTick WebSocket + HTTP; backend proxies `/api/market-data/crypto`, `/api/market-data/forex`, `/api/market-data/commodity`, `/api/market-data/all`. |
| **Auth method** | API key. |
| **Webhooks** | No. |
| **WebSocket** | Yes. |
| **Env vars** | `ALLTICKS_API_KEY`. |
| **DB dependencies** | `scrip_data`, `scrip_ticks_history`, `commodity_forex_crypto_lot_sizes`. |
| **Complexity** | High |
| **Risk if changed** | USD segment prices and P&L break. |
| **Dedicated agent?** | Included under **Market-Data-Agent**. |

### 1.3 Socket.IO

| Field | Details |
|-------|---------|
| **Purpose** | Real-time price ticks, notifications, alerts, trade updates, support messages. |
| **Features using it** | Market Data, Notifications, Alerts, Support Chat, Trade Updates. |
| **Frontend files** | All client `TradeContext`/`MarketContext` files and notification hooks. |
| **Backend files** | `sharemarket-aws-backend-master/src/config/socket.js`, `src/services/MarketDataService.js`, `src/controllers/notificationController.js`, alert services. |
| **SDK/package** | `socket.io` (server), `socket.io-client` (clients). |
| **API methods/endpoints** | WebSocket at `/socket.io`; events `price_update`, `market_data_update`, `notification`, `alert_triggered`, `trade_update`, `support_message_received`. |
| **Auth method** | JWT in handshake or `join` payload. |
| **Webhooks** | No. |
| **WebSocket** | Yes — this is the realtime layer. |
| **Env vars** | `VITE_SOCKET_URL` (frontend/webview); hardcoded `SOCKET_URL` in mobile/webview. |
| **DB dependencies** | Derived from `scrip_ticks_history`, `notifications`, `alerts`, `support_tickets`. |
| **Complexity** | Critical |
| **Risk if changed** | All real-time features stop across clients. |
| **Dedicated agent?** | Yes — owned by **Market-Data-Agent**. |

---

## 2. AI & Voice Integrations

### 2.1 OpenAI API

| Field | Details |
|-------|---------|
| **Purpose** | Smart commands, chat, tutor, schema introspection, voice transcription backend. |
| **Features using it** | AI Smart Commands & Chat, Voice Commands & Transcription, Search. |
| **Frontend files** | `Trading_Frontend-main/src/components/AIAssistant.jsx`, `src/hooks/useVoiceSearch.js`, `src/services/searchController.js`, `src/services/commandParser.js`; `Trading_Webview-main/src/pages/AiAssistant.jsx`; `trading-updated-apk-main/src/screens/others/AiAssistantScreen.js`. |
| **Backend files** | `sharemarket-aws-backend-master/src/controllers/aiController.js`, `src/routes/aiRoutes.js`, AI service/parser files, `src/config/openai.js`. |
| **SDK/package** | `openai`. |
| **API methods/endpoints** | `/api/ai/smart-command`, `/api/ai/master-command`, `/api/ai/mediator`, `/api/ai/chat`, `/api/ai/tutor`, `/api/ai/schema-introspection`, `/api/ai/voice-parse`, `/api/ai/transcribe-voice`; root aliases `/ai-parse`, `/execute-command`, `/smart-command`, `/master-command`. |
| **Auth method** | `OPENAI_API_KEY` server-side. |
| **Webhooks** | No. |
| **WebSocket** | No. |
| **Env vars** | `OPENAI_API_KEY`. |
| **DB dependencies** | `voice_recordings`, `ai_chat_history`, `ai_command_logs`. |
| **Complexity** | Critical |
| **Risk if changed** | AI features stop; LLM SQL execution is a security surface. |
| **Dedicated agent?** | Yes — **AI-Voice-Agent**. |

### 2.2 Web Speech API & MediaRecorder

| Field | Details |
|-------|---------|
| **Purpose** | Browser-native voice input and audio recording fallback. |
| **Features using it** | Voice Commands, AI Assistant. |
| **Frontend files** | `Trading_Frontend-main/src/hooks/useVoiceSearch.js`; `Trading_Webview-main/src/pages/AiAssistant.jsx`. |
| **Backend files** | Receives audio via `/api/ai/transcribe-voice`. |
| **SDK/package** | Browser native APIs. |
| **API methods/endpoints** | `SpeechRecognition`; `MediaRecorder` + upload to `/api/ai/transcribe-voice`. |
| **Auth method** | N/A for browser API; backend requires JWT. |
| **Webhooks** | No. |
| **WebSocket** | No. |
| **Env vars** | None. |
| **DB dependencies** | `voice_recordings`. |
| **Complexity** | Medium |
| **Risk if changed** | Voice input breaks on unsupported browsers. |
| **Dedicated agent?** | Included under **AI-Voice-Agent**. |

### 2.3 expo-audio

| Field | Details |
|-------|---------|
| **Purpose** | Mobile voice recording for AI transcription. |
| **Features using it** | AI Assistant voice commands. |
| **Frontend files** | `trading-updated-apk-main/src/screens/others/AiAssistantScreen.js`. |
| **Backend files** | Receives audio via `/api/ai/transcribe-voice`. |
| **SDK/package** | `expo-audio`. |
| **API methods/endpoints** | Mobile audio recorder → backend `/api/ai/transcribe-voice`. |
| **Auth method** | Backend JWT. |
| **Webhooks** | No. |
| **WebSocket** | No. |
| **Env vars** | None. |
| **DB dependencies** | `voice_recordings`. |
| **Complexity** | Medium |
| **Risk if changed** | Mobile voice input breaks. |
| **Dedicated agent?** | Included under **AI-Voice-Agent** / **Mobile-Agent**. |

---

## 3. File, Email & Storage Integrations

### 3.1 ImageKit

| Field | Details |
|-------|---------|
| **Purpose** | Image/document uploads (KYC, deposit screenshots, logos, profile images). |
| **Features using it** | KYC, Deposit Requests, Admin Theme. |
| **Frontend files** | `Trading_Frontend-main/src/pages/clients/KycUploadPage.jsx`, `src/components/CreateFundForm.jsx`, `src/pages/settings/ThemeSettingsPage.jsx`; `Trading_Webview-main/src/pages/Account.jsx`; `trading-updated-apk-main/src/screens/others/DepositRequestScreen.js`. |
| **Backend files** | `sharemarket-aws-backend-master/src/config/imagekit.js`, `src/controllers/fundController.js`, `src/controllers/userController.js`, `src/controllers/adminController.js`. |
| **SDK/package** | `imagekit`, `multer` (local fallback). |
| **API methods/endpoints** | `POST /api/funds/upload`, `POST /api/users/documents`, `POST /api/admin/panel-theme`. |
| **Auth method** | Server-side public/private key. |
| **Webhooks** | No. |
| **WebSocket** | No. |
| **Env vars** | `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`. |
| **DB dependencies** | `user_documents`, `payment_requests`, `admin_panel_settings`. |
| **Complexity** | Medium |
| **Risk if changed** | Uploads fail; local fallback served without auth. |
| **Dedicated agent?** | Included under **Backend-Platform-Agent**. |

### 3.2 AWS S3

| Field | Details |
|-------|---------|
| **Purpose** | Exported scrip tick history storage. |
| **Features using it** | Scrip Tick Export & Reporting. |
| **Frontend files** | Admin scrip-tick export UI. |
| **Backend files** | `sharemarket-aws-backend-master/src/workers/s3ExportWorker.js`, `src/controllers/scripTickController.js`. |
| **SDK/package** | `@aws-sdk/client-s3` or `aws-sdk`. |
| **API methods/endpoints** | `POST /api/scrip-ticks/export-s3`, `PutObject`. |
| **Auth method** | AWS access key/secret. |
| **Webhooks** | No. |
| **WebSocket** | No. |
| **Env vars** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`. |
| **DB dependencies** | `scrip_ticks_history`, `scrip_export_settings`. |
| **Complexity** | Medium |
| **Risk if changed** | Tick exports fail; credentials must be rotated securely. |
| **Dedicated agent?** | Included under **Backend-Platform-Agent**. |

### 3.3 Brevo / SMTP

| Field | Details |
|-------|---------|
| **Purpose** | Transactional emails (alerts, ticket updates, request status). |
| **Features using it** | Notifications, Support Tickets, Deposit/Withdrawal status. |
| **Frontend files** | None directly. |
| **Backend files** | Notification / support email helpers. |
| **SDK/package** | `nodemailer`, Brevo API. |
| **API methods/endpoints** | SMTP `sendMail` / Brevo transactional email. |
| **Auth method** | SMTP credentials or Brevo API key. |
| **Webhooks** | Possible with Brevo (not currently used). |
| **WebSocket** | No. |
| **Env vars** | `BREVO_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`. |
| **DB dependencies** | `notifications`, `support_tickets`, `payment_requests`. |
| **Complexity** | Low |
| **Risk if changed** | Emails stop sending silently. |
| **Dedicated agent?** | Included under **Backend-Platform-Agent**. |

---

## 4. Infrastructure & Utility Integrations

### 4.1 Redis

| Field | Details |
|-------|---------|
| **Purpose** | Optional caching layer. |
| **Features using it** | Market data caching, general cache. |
| **Frontend files** | None. |
| **Backend files** | `sharemarket-aws-backend-master/src/config/cacheManager.js`, `src/services/MarketDataService.js`. |
| **SDK/package** | `redis`. |
| **API methods/endpoints** | `GET`, `SET`, `EXPIRE`. |
| **Auth method** | Redis password if configured. |
| **Webhooks** | No. |
| **WebSocket** | No. |
| **Env vars** | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`. |
| **DB dependencies** | None. |
| **Complexity** | Low-Medium |
| **Risk if changed** | Falls back to in-memory/disabled; potential stale cache. |
| **Dedicated agent?** | Included under **Market-Data-Agent** / **Backend-Platform-Agent**. |

### 4.2 Puppeteer

| Field | Details |
|-------|---------|
| **Purpose** | Headless browser automation for Kite auto-login. |
| **Features using it** | Kite Authentication, Market Data initialization. |
| **Frontend files** | None. |
| **Backend files** | `sharemarket-aws-backend-master/src/services/KiteAuthService.js`, `src/server.js` (cron wiring). |
| **SDK/package** | `puppeteer`. |
| **API methods/endpoints** | Internal automation. |
| **Auth method** | Uses Zerodha credentials. |
| **Webhooks** | No. |
| **WebSocket** | No. |
| **Env vars** | `PUPPETEER_EXECUTABLE_PATH`. |
| **DB dependencies** | `user_kite_sessions`. |
| **Complexity** | High |
| **Risk if changed** | Kite auto-login breaks. |
| **Dedicated agent?** | Included under **Market-Data-Agent**. |

### 4.3 ipify

| Field | Details |
|-------|---------|
| **Purpose** | Capture client public IP for security headers. |
| **Features using it** | IP Security & Audit, all authenticated API calls. |
| **Frontend files** | `Trading_Frontend-main/src/utils/api.js`, `Trading_Webview-main/src/services/api.js`, `trading-updated-apk-main/src/services/api.js`. |
| **Backend files** | Reads `X-Client-IP` header. |
| **SDK/package** | Native `fetch`. |
| **API methods/endpoints** | `GET https://api.ipify.org?format=json`. |
| **Auth method** | None. |
| **Webhooks** | No. |
| **WebSocket** | No. |
| **Env vars** | None. |
| **DB dependencies** | `ip_logins`, `ip_logs`. |
| **Complexity** | Low |
| **Risk if changed** | IP audit header missing; privacy leak to third party. |
| **Dedicated agent?** | Included under **Auth-Security-Agent**. |

---

## 5. UI / Content Embeds

### 5.1 TradingView Widget

| Field | Details |
|-------|---------|
| **Purpose** | Economic calendar widget. |
| **Features using it** | Economic Calendar (WebView). |
| **Frontend files** | `Trading_Webview-main/src/pages/Account.jsx`. |
| **Backend files** | None. |
| **SDK/package** | TradingView embed script. |
| **API methods/endpoints** | `https://s3.tradingview.com/external-embedding/embed-widget-events.js`. |
| **Auth method** | None. |
| **Webhooks** | No. |
| **WebSocket** | No. |
| **Env vars** | None. |
| **DB dependencies** | None. |
| **Complexity** | Low |
| **Risk if changed** | Calendar blank; `innerHTML` injection risk. |
| **Dedicated agent?** | Included under **WebView-Agent**. |

### 5.2 YouTube IFrame API

| Field | Details |
|-------|---------|
| **Purpose** | Learning module video player. |
| **Features using it** | Learning / Trading Academy. |
| **Frontend files** | `Trading_Webview-main/src/pages/Account.jsx`; `trading-updated-apk-main/src/screens/others/LearningScreen.js`. |
| **Backend files** | None. |
| **SDK/package** | YouTube IFrame API, `react-native-webview`. |
| **API methods/endpoints** | `https://www.youtube.com/embed/<VIDEO_ID>?enablejsapi=1`. |
| **Auth method** | None. |
| **Webhooks** | No. |
| **WebSocket** | No. |
| **Env vars** | None. |
| **DB dependencies** | None. |
| **Complexity** | Low |
| **Risk if changed** | Video fails; mobile `postMessage` lacks origin validation. |
| **Dedicated agent?** | Included under **WebView-Agent** / **Mobile-Agent**. |

### 5.3 Forex Factory

| Field | Details |
|-------|---------|
| **Purpose** | External economic calendar link/display. |
| **Features using it** | Economic Calendar. |
| **Frontend files** | `Trading_Webview-main/src/pages/Account.jsx`; `trading-updated-apk-main/src/screens/others/EconomicCalendarScreen.js`. |
| **Backend files** | None. |
| **SDK/package** | `react-native-webview`, browser `window.open`. |
| **API methods/endpoints** | `https://www.forexfactory.com/calendar`. |
| **Auth method** | None. |
| **Webhooks** | No. |
| **WebSocket** | No. |
| **Env vars** | None. |
| **DB dependencies** | None. |
| **Complexity** | Low |
| **Risk if changed** | Calendar blank; `window.opener` tabnabbing risk. |
| **Dedicated agent?** | Included under **WebView-Agent** / **Mobile-Agent**. |

---

## 6. Mobile Framework Integrations

### 6.1 Expo SDK / EAS

| Field | Details |
|-------|---------|
| **Purpose** | Mobile app framework, native APIs, build distribution, OTA updates. |
| **Features using it** | Entire mobile app. |
| **Frontend files** | `trading-updated-apk-main/App.js`, `src/screens/*`, `src/components/*`. |
| **Backend files** | None. |
| **SDK/package** | `expo`, `expo-image-picker`, `expo-audio`, `expo-media-library`, `expo-linear-gradient`, `expo-splash-screen`, `expo-updates`, `expo-navigation-bar`, `expo-font`, `react-native-webview`, `@react-navigation/native`, `lucide-react-native`, `@expo/vector-icons`. |
| **API methods/endpoints** | EAS Build APIs via `eas.json`; OTA via `expo-updates`. |
| **Auth method** | EAS project ID in `app.json`. |
| **Webhooks** | EAS build webhooks possible (not currently used). |
| **WebSocket** | No. |
| **Env vars** | None currently. |
| **DB dependencies** | None. |
| **Complexity** | High |
| **Risk if changed** | Version mismatch (Expo 57 vs SDK 54 vs RN 0.86) can break builds. |
| **Dedicated agent?** | Yes — included under **Mobile-Agent**. |

---

## 7. Summary: Which Integrations Deserve Dedicated Specialist Agents

| Integration | Recommended owning agent |
|-------------|--------------------------|
| Zerodha Kite Connect | **Market-Data-Agent** |
| AllTick | **Market-Data-Agent** |
| Socket.IO realtime layer | **Market-Data-Agent** |
| OpenAI API | **AI-Voice-Agent** |
| Web Speech / MediaRecorder / expo-audio | **AI-Voice-Agent** |
| ImageKit | **Backend-Platform-Agent** |
| AWS S3 | **Backend-Platform-Agent** |
| Brevo/SMTP | **Backend-Platform-Agent** |
| Redis | **Market-Data-Agent** / **Backend-Platform-Agent** |
| Puppeteer | **Market-Data-Agent** |
| ipify | **Auth-Security-Agent** |
| TradingView / YouTube / ForexFactory | **WebView-Agent** / **Mobile-Agent** |
| Expo SDK / EAS | **Mobile-Agent** |
