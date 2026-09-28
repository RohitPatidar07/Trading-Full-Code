# 10 Recommended Specialist Coding Agents

Based on the full codebase analysis of the VTRKM trading platform, these 10 agents are recommended. Each agent owns a complex, isolated, or high-risk domain.

> **Note:** This is a recommendation map only. No actual agents have been created, and no application code has been modified.

---

## 1. Auth & Security Agent

**Responsibility:** Authentication, authorization, session management, JWT, roles, permissions, route guards, password policies, IP audit, and security hardening across backend, frontend, WebView, and mobile.

**Why it needs its own agent:** Security is a cross-cutting concern. JWT storage, role checks, transaction passwords, and session invalidation must be consistent everywhere. The project has committed secrets, hardcoded credentials, unauthenticated AI routes, and `localStorage` JWT storage — all requiring focused security expertise.

**Allowed modules:** All modules.

---

## 2. Database Agent

**Responsibility:** MySQL schema design, migrations, indexes, query optimization, data integrity, partitioning/archiving strategy, and reporting SQL.

**Why it needs its own agent:** The schema has ~60 tables, duplicate indexes, unenforced foreign keys, JSON-as-text columns, and a high-volume `scrip_ticks_history` table. Financial correctness depends on `trades`, `ledger`, and settlement tables staying aligned.

**Allowed modules:** `trading_db_live_backup.sql`, `sharemarket-aws-backend-master/src/config/migrate.js`, `migrations/`, schema-related queries.

---

## 3. Trading Engine Agent

**Responsibility:** Order lifecycle (place, modify, cancel, close), positions, P&L, margin, brokerage, RMS auto square-off, target/stop-loss, pending orders, weekly settlements, and paper trading parity.

**Why it needs its own agent:** This is the highest-risk domain — real money moves here. `tradeController.js` is ~3,176 lines. Margin/P&L math is duplicated across backend and clients. RMS can force-close positions. Settlement bugs corrupt balances.

**Allowed modules:** Backend trade/margin/settlement services and controllers; client-side trade/order/portfolio/P&L utilities and screens.

---

## 4. Market Data Agent

**Responsibility:** Zerodha Kite integration, AllTick integration, Socket.IO realtime events, instrument sync, watchlists, scrip tick history, options/MCX chain data, and price broadcast contracts.

**Why it needs its own agent:** Kite integration alone is 2,403 lines. Live prices feed trading, P&L, RMS, alerts, and watchlists. Symbol key conventions and event contracts must be maintained consistently across backend and all clients.

**Allowed modules:** Backend market data services/controllers/routes/socket wiring; client market data contexts/pages and Kite API wrappers.

---

## 5. AI & Voice Agent

**Responsibility:** OpenAI integration, smart commands, chat, tutor, natural-language parsing (Hindi/English/Hinglish), voice transcription, command safety, and command execution routing.

**Why it needs its own agent:** `aiController.js` is 1,281 lines and executes LLM-generated SQL. Unauthenticated root AI routes exist. Command parsers are duplicated across WebView and mobile. Voice input has browser-native and fallback paths.

**Allowed modules:** Backend AI controllers/services/parsers; client AI assistant screens, command parsers, and voice hooks.

---

## 6. Backend Platform Agent

**Responsibility:** Core backend API platform excluding trading engine, market data, AI, and auth: users, KYC, funds/ledger workflows, deposit/withdrawal requests, internal transfers, support tickets, notifications, alerts, signals, admin/system settings, bank details, contract management (non-rollover trade logic), and tick export/reporting.

**Why it needs its own agent:** The backend is large and monolithic. Separating the platform/admin/support/fund domain from trading and market data reduces blast radius and allows parallel work.

**Allowed modules:** Backend controllers/routes/services for users, funds, portfolio, support, notifications, alerts, admin, system, signals, banks, contracts (non-rollover), exports; ImageKit, AWS S3, Brevo/SMTP integrations.

---

## 7. Frontend Web Agent

**Responsibility:** React 19 admin/dashboard frontend: routing, pages, components, contexts, API integration, reports/export, theming, and responsive UI.

**Why it needs its own agent:** `App.jsx` has 70+ routes. The admin UI is large and has many CRUD pages. Keeping frontend changes isolated prevents backend interference.

**Allowed modules:** `Trading_Frontend-main/src/*`.

---

## 8. WebView Agent

**Responsibility:** React WebView trading client: mobile-first UI, watchlist, order placement, portfolio, account screens, AI assistant, voice commands, and WebView-safe layout.

**Why it needs its own agent:** `TradeContext.jsx` is 2,204 lines; `Account.jsx` is 3,027 lines. The WebView app has its own backend URL issues, demo price fallback, and hardcoded Railway registration endpoint.

**Allowed modules:** `Trading_Webview-main/src/*`.

---

## 9. Mobile Agent

**Responsibility:** Expo/React Native mobile app: screens, navigation, context, native APIs (image picker, audio, WebView), permissions, build config (`app.json`, `eas.json`), and mobile-specific UI/UX.

**Why it needs its own agent:** Mobile has native complexity, Expo version mismatches, hardcoded backend IP, non-functional sign-up, and broad Android permissions. Native changes require different expertise than web.

**Allowed modules:** `trading-updated-apk-main/src/*`, `App.js`, `app.json`, `eas.json`, `metro.config.js`, `babel.config.js`.

---

## 10. Testing & Regression Agent

**Responsibility:** Test strategy, unit tests, integration tests, regression suites, mocking of external APIs (Kite, AllTick, OpenAI), and CI pipeline setup for lint/test/build.

**Why it needs its own agent:** The project has **zero automated tests**. This is the single biggest risk to "code kabhi phate na." A dedicated agent can introduce tests incrementally for the most critical paths: auth, trade placement, P&L/margin, ledger, settlement, and market data contracts — without breaking existing code.

**Allowed modules:** Test files across all modules; CI config (`.github/workflows/`); no application code changes except to make code testable in safe, non-breaking ways.

---

## Agent Collaboration Rules

1. **Auth-Security-Agent** must review any change to login, JWT, roles, permissions, or session storage in any module.
2. **Database-Agent** must review any schema, migration, index, or table change.
3. **Trading-Engine-Agent** must review any change to order logic, P&L, margin, brokerage, RMS, or settlement.
4. **Market-Data-Agent** must review any change to Socket.IO events, Kite/AllTick integration, symbol conventions, or instrument sync.
5. **AI-Voice-Agent** must review any new AI command, parser change, or voice/transcription change.
6. **Backend-Platform-Agent** must review changes to admin, fund, support, notification, and export APIs.
7. Client agents (Frontend-Web, WebView, Mobile) must keep API/event contracts in sync with backend agents.
8. **Testing & Regression Agent** can add tests but must not change application behavior without the owning agent's review.

---

## Tightly Coupled Groups That Should Stay Together

| Group | Owner |
|-------|-------|
| Order placement → pending orders → target/SL → close → P&L → ledger | Trading-Engine-Agent |
| Margin → RMS → M2M dashboards | Trading-Engine-Agent |
| Weekly settlement → carry-forward → ledger → balance | Trading-Engine-Agent |
| Kite login → instrument sync → ticker → Socket.IO → watchlists | Market-Data-Agent |
| AI smart commands → parser → voice transcription → command safety | AI-Voice-Agent |
| Login → JWT storage → route guards → inactivity logout → role menus | Auth-Security-Agent |
| Deposit/withdrawal request → approval → ledger → balance | Trading-Engine-Agent + Backend-Platform-Agent |
