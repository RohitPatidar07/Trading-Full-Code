> **Note:** This is an updated recommendation that expands the earlier `10-RECOMMENDED-AGENTS.md`. Here we map **15 integration-specific agents** (one per integration doc in `docs/analysis/integrations/`) plus **5 feature-specific agents** for the most complex business domains, totaling **20 specialist coding agents**.

# 20 Recommended Specialist Coding Agents

---

## Part A — 15 Integration-Specific Agents

Each agent below owns one third-party integration end-to-end: connection, credentials, error handling, fallback logic, and the API contract with the rest of the codebase.

### 1. Zerodha-Kite-Agent

**Owns:** `docs/analysis/integrations/01-Zerodha-Kite-Connect.md`

**Responsibility:** Zerodha Kite Connect integration — OAuth login, access token lifecycle, instrument sync, live quotes, margins, holdings, positions, order placement, and Kite Ticker WebSocket relay.

**Why dedicated:** Kite is the dominant broker integration (`kiteRoutes.js` is 2,403 lines). Live Indian market data and order flow depend on it.

**Allowed modules:**
- Backend: `src/routes/kiteRoutes.js`, `src/controllers/kiteController.js`, `src/services/KiteAuthService.js`, `src/services/MarketDataService.js` (Kite parts), `src/config/socket.js` (Kite relay), `src/data/kite_session.json`.
- Clients: Kite dashboard, watchlist, options chain, MCX chain pages and API wrappers.

---

### 2. AllTick-Agent

**Owns:** `docs/analysis/integrations/02-AllTick.md`

**Responsibility:** AllTick WebSocket/HTTP integration for crypto, forex, and commodity market data.

**Why dedicated:** Separate provider from Kite; USD segment prices feed P&L and watchlists.

**Allowed modules:**
- Backend: `src/services/allticks.service.js`, `src/services/MarketDataService.js` (AllTick parts), `src/controllers/marketDataController.js`.
- Clients: Crypto/forex/commodity watchlist and market data pages.

---

### 3. SocketIO-Agent

**Owns:** `docs/analysis/integrations/09-SocketIO.md`

**Responsibility:** Socket.IO server and client contracts — price broadcasts, notifications, alerts, trade updates, support messages, reconnection logic.

**Why dedicated:** This is the realtime backbone of the entire platform. Event contract changes break all clients.

**Allowed modules:**
- Backend: `src/config/socket.js`, emit points in `MarketDataService`, `notificationController`, alert services.
- Clients: All `TradeContext`/`MarketContext`/notification hooks and socket event handlers.

---

### 4. OpenAI-Agent

**Owns:** `docs/analysis/integrations/03-OpenAI.md`

**Responsibility:** OpenAI API integration — prompt engineering, chat completions, schema introspection, response parsing, cost/rate-limit management.

**Why dedicated:** AI features are complex and security-sensitive; LLM-generated SQL is a major attack surface.

**Allowed modules:**
- Backend: `src/controllers/aiController.js` (OpenAI parts), `src/config/openai.js`, AI service/prompt files.
- Clients: AI assistant chat and smart-command API wrappers.

---

### 5. Web-Speech-MediaRecorder-Agent

**Owns:** `docs/analysis/integrations/11-Web-Speech-and-MediaRecorder.md`

**Responsibility:** Browser-native voice input (`SpeechRecognition`) and audio recording fallback (`MediaRecorder`).

**Why dedicated:** Voice UX has cross-browser compatibility issues and fallback paths.

**Allowed modules:**
- Frontend Web: `src/hooks/useVoiceSearch.js`, AI assistant voice input.
- WebView: `src/pages/AiAssistant.jsx` voice recording.

---

### 6. Expo-Audio-Agent

**Owns:** `docs/analysis/integrations/02-OpenAI.md` (mobile voice part)

**Responsibility:** Mobile voice recording using `expo-audio` for AI transcription.

**Why dedicated:** Native mobile audio has permission, format, and lifecycle differences from browser audio.

**Allowed modules:**
- Mobile: `src/screens/others/AiAssistantScreen.js`, audio/recording utilities.

---

### 7. ImageKit-Agent

**Owns:** `docs/analysis/integrations/04-ImageKit.md`

**Responsibility:** ImageKit upload integration for KYC docs, deposit screenshots, logos, and profile images.

**Why dedicated:** File uploads touch sensitive PII; local fallback is a security gap that needs focused ownership.

**Allowed modules:**
- Backend: `src/config/imagekit.js`, upload endpoints in `fundController`, `userController`, `adminController`.
- Clients: KYC upload, deposit screenshot, theme/logo upload flows.

---

### 8. AWS-S3-Agent

**Owns:** `docs/analysis/integrations/05-AWS-S3.md`

**Responsibility:** AWS S3 integration for tick history export and archive storage.

**Why dedicated:** S3 exports run in background workers and handle large datasets; credential/security risks.

**Allowed modules:**
- Backend: `src/workers/s3ExportWorker.js`, `src/controllers/scripTickController.js` (S3 export).

---

### 9. Brevo-SMTP-Agent

**Owns:** `docs/analysis/integrations/06-Brevo-SMTP.md`

**Responsibility:** Email delivery via Brevo/SMTP for transactional emails.

**Why dedicated:** Silent email failures can cause compliance and user-trust issues.

**Allowed modules:**
- Backend: Email helpers in notification/support services.

---

### 10. Redis-Agent

**Owns:** `docs/analysis/integrations/07-Redis.md`

**Responsibility:** Redis caching layer — connection, cache keys, TTL, fallback behavior.

**Why dedicated:** Caching affects performance and price consistency; stale cache can show wrong market data.

**Allowed modules:**
- Backend: `src/config/cacheManager.js`, cache usage in `MarketDataService`.

---

### 11. Puppeteer-Agent

**Owns:** `docs/analysis/integrations/08-Puppeteer.md`

**Responsibility:** Headless Kite auto-login automation.

**Why dedicated:** Brittle against Kite UI changes; security-sensitive (handles Zerodha credentials).

**Allowed modules:**
- Backend: `src/services/KiteAuthService.js`, cron wiring in `src/server.js`.

---

### 12. ipify-Agent

**Owns:** `docs/analysis/integrations/10-ipify.md`

**Responsibility:** Client public IP capture and `X-Client-IP` header handling.

**Why dedicated:** Privacy and audit concerns; used across all clients.

**Allowed modules:**
- Clients: `api.js` files in frontend, webview, and mobile.
- Backend: IP reading in audit/security middleware.

---

### 13. TradingView-Widget-Agent

**Owns:** `docs/analysis/integrations/12-TradingView-Widget.md`

**Responsibility:** TradingView economic calendar widget embedding in WebView.

**Why dedicated:** External script injection via `innerHTML` is a supply-chain XSS risk.

**Allowed modules:**
- WebView: `src/pages/Account.jsx` (calendar section).

---

### 14. YouTube-IFrame-Agent

**Owns:** `docs/analysis/integrations/13-YouTube-IFrame.md`

**Responsibility:** YouTube learning module embed for WebView and mobile.

**Why dedicated:** Cross-origin iframe/postMessage handling and mobile WebView security.

**Allowed modules:**
- WebView: `src/pages/Account.jsx` (learning section).
- Mobile: `src/screens/others/LearningScreen.js`.

---

### 15. ForexFactory-Agent

**Owns:** `docs/analysis/integrations/14-ForexFactory.md`

**Responsibility:** Forex Factory economic calendar link/display.

**Why dedicated:** External WebView navigation and `window.opener` tabnabbing risk.

**Allowed modules:**
- WebView: `src/pages/Account.jsx`.
- Mobile: `src/screens/others/EconomicCalendarScreen.js`.

---

### 16. Expo-Services-Agent

**Owns:** `docs/analysis/integrations/15-Expo-Services.md`

**Responsibility:** Expo SDK, EAS build profiles, OTA updates, native permissions, and mobile build pipeline.

**Why dedicated:** Native mobile builds are complex and currently have version mismatches (Expo 57 vs SDK 54 vs RN 0.86).

**Allowed modules:**
- Mobile: `App.js`, `app.json`, `eas.json`, `metro.config.js`, `babel.config.js`, Expo plugin usage in screens.

---

## Part B — 5 Feature-Specific Agents

These agents own the most complex business domains that span multiple integrations.

### 17. Trading-Engine-Agent

**Owns:** Order lifecycle, positions, P&L, margin, brokerage, RMS, target/SL, pending orders, weekly settlements, paper trading parity.

**Why dedicated:** This is the highest-risk domain — real money moves here. `tradeController.js` is ~3,176 lines. Margin/P&L math is duplicated across backend and clients.

**Allowed modules:**
- Backend: `src/controllers/tradeController.js`, `src/controllers/marginController.js`, `src/controllers/weeklySettlementController.js`, `src/controllers/requestController.js`, `src/controllers/fundController.js`, `src/controllers/portfolioController.js`, `src/services/TradeService.js`, `src/services/PendingOrderService.js`, `src/services/targetSLService.js`, `src/services/RMSService.js`, `src/services/WeeklySettlementService.js`, P&L/margin/brokerage utilities.
- Clients: Trade/order/portfolio/P&L/margin screens and utilities in frontend, webview, and mobile.

**Coordinates with:** Zerodha-Kite-Agent, AllTick-Agent, SocketIO-Agent, Database-Agent, Auth-Security-Agent.

---

### 18. Auth-Security-Agent

**Owns:** Authentication, authorization, JWT, sessions, roles, permissions, route guards, password policies, transaction password, IP audit, security hardening.

**Why dedicated:** Security is cross-cutting. The project has committed secrets, hardcoded credentials, unauthenticated AI routes, and `localStorage` JWT storage.

**Allowed modules:**
- Backend: `src/middleware/auth.js`, `src/controllers/authController.js`, `src/routes/authRoutes.js`, `src/controllers/securityController.js`, `src/controllers/userController.js` (session/status).
- All clients: Login pages, auth contexts, route guards, inactivity logout, API session wrappers, `app.json` permissions.

**Coordinates with:** All other agents.

---

### 19. Database-Agent

**Owns:** MySQL schema, migrations, indexes, query optimization, data integrity, partitioning/archiving, reporting SQL.

**Why dedicated:** ~60 tables, duplicate indexes, unenforced foreign keys, JSON-as-text columns, high-volume `scrip_ticks_history`. Financial correctness depends on `trades`, `ledger`, and settlement tables.

**Allowed modules:**
- `trading_db_live_backup.sql`
- `sharemarket-aws-backend-master/src/config/migrate.js`
- `sharemarket-aws-backend-master/migrations/`
- `sharemarket-aws-backend-master/src/config/db.js` (query patterns/connection)
- All schema and reporting SQL.

**Coordinates with:** Trading-Engine-Agent, Market-Data-related agents, Backend-Platform-Agent.

---

### 20. AI-Commands-Agent

**Owns:** Natural-language command parsing (Hindi/English/Hinglish), command execution routing, command safety, chat/tutor UX, and AI assistant business logic.

**Why dedicated:** Separate from OpenAI API integration. Command parsers are duplicated across WebView and mobile. Admin-oriented commands are exposed in mobile. LLM SQL execution needs strict guards.

**Allowed modules:**
- Backend: `src/controllers/aiController.js` (command/parser parts), `src/routes/aiRoutes.js`, AI parser/mediator files, `src/routes/voiceRecordingController.js`.
- Clients: AI assistant screens, `commandParser.js` files, search/voice controllers, `voiceCommandConfig.js`.

**Coordinates with:** OpenAI-Agent, Web-Speech-MediaRecorder-Agent, Expo-Audio-Agent, Trading-Engine-Agent, Auth-Security-Agent.

---

### 21. User-Fund-Platform-Agent

**Owns:** User/client/broker/admin management, KYC, bank details, fund deposit/withdrawal workflows, internal transfers, ledger entries, support tickets, notifications, alerts, admin/system settings, signals.

**Why dedicated:** This is the broad backend platform domain outside of trading engine, market data, and AI. It involves user hierarchy, real-money requests, audit trails, and admin workflows.

**Allowed modules:**
- Backend: `src/server.js`, `src/controllers/userController.js`, `src/controllers/fundController.js`, `src/controllers/requestController.js`, `src/controllers/portfolioController.js`, `src/controllers/supportController.js`, `src/controllers/notificationController.js`, `src/controllers/alertController.js`, `src/controllers/adminController.js`, `src/controllers/systemController.js`, `src/controllers/signalController.js`, `src/controllers/bankController.js`, `src/controllers/accountController.js`, `src/workers/s3ExportWorker.js`, `src/workers/pdfExportWorker.js`, `src/config/imagekit.js`, `src/config/cacheManager.js`.
- Clients: User/client/broker/admin CRUD pages, fund forms, support/notification/alert screens, admin settings.

**Coordinates with:** Trading-Engine-Agent (ledger/funds), ImageKit-Agent, AWS-S3-Agent, Brevo-SMTP-Agent, Redis-Agent, Database-Agent, Auth-Security-Agent.

---

## Agent Collaboration Map

```
Auth-Security-Agent
    ↑ required by ALL other agents

Database-Agent
    ← Trading-Engine-Agent, User-Fund-Platform-Agent, all integration agents

Zerodha-Kite-Agent + AllTick-Agent + SocketIO-Agent
    ←→ Trading-Engine-Agent (prices, symbol conventions)
    ←→ User-Fund-Platform-Agent (dashboards, notifications)

OpenAI-Agent + Web-Speech-MediaRecorder-Agent + Expo-Audio-Agent
    ←→ AI-Commands-Agent (command parsing and safety)

ImageKit-Agent + AWS-S3-Agent + Brevo-SMTP-Agent + Redis-Agent
    ←→ User-Fund-Platform-Agent

Puppeteer-Agent
    ←→ Zerodha-Kite-Agent (auto-login)

ipify-Agent
    ←→ Auth-Security-Agent (IP audit)

TradingView-Widget-Agent + YouTube-IFrame-Agent + ForexFactory-Agent
    ←→ WebView-Agent / Mobile-Agent (UI embedding)

Expo-Services-Agent
    ←→ Mobile-Agent (native builds)
```

---

## Quick Task-to-Agent Reference

| Task | Primary agent | Coordinates with |
|------|---------------|------------------|
| Kite login/token issue | Zerodha-Kite-Agent | Puppeteer-Agent, SocketIO-Agent |
| Crypto/forex price wrong | AllTick-Agent | SocketIO-Agent, Trading-Engine-Agent |
| Real-time events not firing | SocketIO-Agent | Market-data and notification emitters |
| AI command unsafe / wrong | AI-Commands-Agent | OpenAI-Agent, Auth-Security-Agent |
| Voice input broken on web | Web-Speech-MediaRecorder-Agent | AI-Commands-Agent |
| Voice input broken on mobile | Expo-Audio-Agent | AI-Commands-Agent |
| File upload fails | ImageKit-Agent | User-Fund-Platform-Agent |
| Tick export fails | AWS-S3-Agent | User-Fund-Platform-Agent, Database-Agent |
| Email not sending | Brevo-SMTP-Agent | User-Fund-Platform-Agent |
| Cache stale / performance | Redis-Agent | Market-Data-Agent, User-Fund-Platform-Agent |
| Kite auto-login broken | Puppeteer-Agent | Zerodha-Kite-Agent |
| IP audit missing | ipify-Agent | Auth-Security-Agent |
| Trade P&L wrong | Trading-Engine-Agent | Zerodha-Kite-Agent, AllTick-Agent, Database-Agent |
| Margin/RMS issue | Trading-Engine-Agent | Database-Agent, Auth-Security-Agent |
| Settlement wrong | Trading-Engine-Agent | Database-Agent |
| Login/session issue | Auth-Security-Agent | All client agents |
| Schema/index change | Database-Agent | Owning feature agent |
| User/fund request bug | User-Fund-Platform-Agent | Trading-Engine-Agent, Database-Agent |
