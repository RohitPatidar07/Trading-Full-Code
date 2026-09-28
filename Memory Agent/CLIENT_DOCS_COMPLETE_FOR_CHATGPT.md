# 🤖 MaintenX OS – Complete Master System Knowledge & AI Prompt Context Pack
**Document Type:** All-In-One Master System Manual & Technical Context Pack  
**Intended Use:** Drop-in context prompt for LLMs (ChatGPT / Claude / Gemini) or Senior Engineer Onboarding  
**System Brand:** MaintenX OS Trading & Broking Ecosystem  
**Workspace Root:** `d:\Trading Full Code\`  

---

## 1. Executive Summary & Codebase Ecosystem

MaintenX OS is a full-stack, enterprise-grade multi-tier financial trading platform supporting **NSE Equities**, **NFO Index/Stock Options & Futures**, **MCX Commodity Futures**, **Foreign Exchange (Forex)**, and **Cryptocurrency Spot/Derivatives**.

### The 4 Codebases in the Workspace:
1. **[`sharemarket-aws-backend-master`](file:///d:/Trading%20Full%20Code/sharemarket-aws-backend-master/) (Core Backend Engine)**:
   - **Stack:** Node.js v20+, Express 5.2.1, Socket.io 4.8.3, MySQL2 3.19.1, Redis 5.11, KiteConnect 5.1, Puppeteer 25.7, OpenAI SDK 6.32, Otplib 12.0.1, Nodemailer 9.0.5, PDFKit 0.18.
   - **Capabilities:** High-throughput order management system (OMS), paper trading engine, automated 8:30 AM IST Zerodha headless login, real-time risk management (RMS), automated stop-loss/target monitoring, Sunday weekly settlements, and AI voice trading.
2. **[`Trading_Frontend-main`](file:///d:/Trading%20Full%20Code/Trading_Frontend-main/) (Web Admin & Broker Portal)**:
   - **Stack:** Vite 7.3.1, React 19.2.0, Tailwind CSS v4, Lucide React, jsPDF, XLSX, Socket.io Client.
   - **Capabilities:** Hierarchical access for Superadmin, Admin, and Sub-Brokers. Real-time Live M2M matrix, client onboarding, KYC document verification, segment leverage management, banned scrip lists, deposit/withdrawal approvals, and audit trails.
3. **[`trading-updated-apk-main`](file:///d:/Trading%20Full%20Code/trading-updated-apk-main/) (Mobile Trader Native App)**:
   - **Stack:** React Native 0.86.3, Expo SDK 57, React 19.2.3, React Navigation 7, Lucide React Native, Socket.io Client.
   - **Capabilities:** High-frequency market watchlist, order placement bottom sheet (Market, Limit, Stop-Loss), live positions portfolio with sub-100ms P&L updates, speech-to-trade AI floating microphone, double-entry financial ledger, and bank management.
4. **[`Trading_Webview-main`](file:///d:/Trading%20Full%20Code/Trading_Webview-main/) (Responsive Webview Portal)**:
   - **Stack:** Vite 8.1.1, React 19.2.7, Oxlint, Socket.io Client.
   - **Capabilities:** Responsive mobile-first browser trading portal mirroring native mobile capabilities.
5. **Database (`trading_db`)**:
   - MySQL 8.4 RDS instance with automated zero-downtime startup migrations managed via `src/config/migrate.js`.

---

## 2. Multi-Tier Role Hierarchy & Permissions

```
┌────────────────────────────────────────────────────────────────────────┐
│                              SUPERADMIN                                │
│  • Global platform master controls & server configuration              │
│  • Executes Sunday Weekly Settlements & Reset ID jobs                  │
│  • Emergency one-click square-off across all server positions          │
│  • Edits or deletes trades with automated ledger & margin reversals    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                                 ADMIN                                  │
│  • Creates and manages Sub-Brokers & Direct Clients                    │
│  • Manages global Banned Scrips & prohibited Limit Order schedules    │
│  • Approves/Rejects client deposits & withdrawals                      │
│  • Monitors Live M2M risk matrix across all brokers                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            BROKER / MASTER                             │
│  • Onboards trading clients under their branch                         │
│  • Sets client credit limits, margin exposure, and brokerage shares    │
│  • Monitors live positions and P&L of their child traders              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                                TRADER                                  │
│  • Streams real-time market watchlists                                 │
│  • Places Market, Limit, and Stop-Loss orders                          │
│  • Tracks live open position M2M with sub-second tick updates          │
│  • Manages fund deposit requests and withdrawal claims                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Financial Calculation Formulas & Math Rules

### 3.1 Real-Time Profit & Loss (PnL)
- **Equity / NSE / NFO Futures:**
  $$\text{BUY PnL} = (\text{Exit Price} - \text{Entry Price}) \times \text{Total Shares}$$
  $$\text{SELL PnL} = (\text{Entry Price} - \text{Exit Price}) \times \text{Total Shares}$$
- **MCX Commodities:**
  $$\text{PnL} = (\text{Exit Price} - \text{Entry Price}) \times \text{Lots} \times \text{Lot Size}$$
  - Key MCX Lot Multipliers: `GOLD`: 100, `GOLDM`: 10, `SILVER`: 30, `SILVERM`: 5, `CRUDEOIL`: 100, `CRUDEOILM`: 10, `NATURALGAS`: 1250, `COPPER`: 2500, `ZINC`: 5000.
- **Crypto / Forex / Comex (International):**
  $$\text{Raw USD PnL} = (\text{Exit Price} - \text{Entry Price}) \times \text{Lot Size} \times \text{Quantity}$$
  $$\text{PnL (INR)} = \text{Raw USD PnL} \times \text{Selected USD/INR Rate}$$
  - **Asymmetric FX Rule:**  
    If $\text{Raw USD PnL} \ge 0$ (Profit) $\rightarrow$ uses **`liveAsk`** (fallback: $95.1 \times 0.90 = \mathbf{85.59}$).  
    If $\text{Raw USD PnL} < 0$ (Loss) $\rightarrow$ uses **`liveBid`** (fallback: $95.1 \times 1.10 = \mathbf{104.61}$).  
  - **Direct INR Pairs (`USDINR`):** No currency conversion applied ($\text{Rate} = 1.0$).

### 3.2 Margin Requirements
- **Per-Lot Basis:** $\text{Required Margin} = \text{Lots} \times \text{Configured Margin Per Lot}$
- **Per-Turnover Basis:**
  $$\text{Required Margin} = \dfrac{\text{Price} \times \text{Actual Quantity} \times (\text{USD/INR if Foreign})}{\text{Exposure Divisor (e.g. 500, 200)}}$$

### 3.3 Brokerage Calculations
- **`PER_LOT` Mode:** $\text{Brokerage} = \text{Lots} \times \text{Rate per Lot}$
- **`PER_CRORE` Mode (Turnover Basis):**
  $$\text{Brokerage} = \left(\dfrac{(\text{Entry Price} + \text{Exit Price}) \times \text{Quantity} \times \text{FX Rate}}{1,00,00,000}\right) \times \text{Brokerage Rate}$$

---

## 4. Real-Time Market Streaming & WebSocket Protocol

- **Server Engine:** `SocketManager.js` (Socket.io 4.8.3 on Port 5000).
- **Client Rooms:**
  - `user:<userId>`: Private trade fills, margin alerts, square-off notices.
  - `role:<role>`: Superadmin/Admin global broadcast alerts.
- **Normalized Price Object (`price_update`):**
  ```json
  {
    "GOLD": {
      "ltp": 72540.00,
      "bid": 72538.00,
      "ask": 72542.00,
      "high": 72800.00,
      "low": 72100.00,
      "close": 72450.00,
      "open": 72200.00,
      "volume": 14250,
      "change": 90.00,
      "change_pct": 0.12
    }
  }
  ```
- **Rule:** WebSocket is the **single source of truth** for market rates. Redundant REST polling intervals for live quotes are eliminated to prevent race condition overwrites.

---

## 5. Risk Management System (RMS) Specifications

1. **Daemon:** [`RMSService.js`](file:///d:/Trading%20Full%20Code/sharemarket-aws-backend-master/src/services/RMSService.js) executes continuously every 10 seconds.
2. **Margin Utilization Formula:**
   $$\text{Margin Utilization \%} = \left(\dfrac{\text{Locked Margin} + |\text{Unrealized M2M Loss}|}{\text{Total Available Capital (Balance + Credit)}}\right) \times 100$$
3. **Automated Escalation Protocol:**
   - **At $70\%$ Utilization:** Emits warning notification and socket alert to trader.
   - **At $90\%$ Utilization (`auto_close_at_m2m_pct`):**
     1. Automatically executes market square-off on all open trades.
     2. Cancels all pending limit orders.
     3. Locks account from opening fresh positions (`allow_fresh_entry = 0`).
     4. Logs liquidation in `action_ledger`.

---

## 6. Database Architecture & Key Tables Summary

The database comprises 30 production tables managed via auto-migrations:
- `users`: Core identity, roles, available balances, credit limits, parent IDs.
- `trades`: Order book, entry/exit prices, status (`OPEN`, `CLOSED`, `SETTLED`), stop-loss, targets.
- `ledger`: Double-entry running balance history. Every financial event creates an immutable row.
- `user_segments`: 6 rows per user defining permissions, leverage, and brokerage for MCX, Equity, Options, Comex, Forex, Crypto.
- `client_settings`: Auto-close M2M %, scalping lock duration, fresh entry toggles.
- `payment_requests`: Deposit and withdrawal approval queue with UTR and payment screenshot URLs.
- `weekly_settlements` & `weekly_settlement_items`: Archive of Sunday weekly closing calculations.
- `banned_scrips` & `banned_limit_orders`: Global and scheduled instrument trading bans.
- `scrip_ticks_history`: High-frequency tick database with automated weekly purge cron.

---

## 7. Resolution of Mobile PRD Issues (Items 1 to 10)

| PRD Problem | Architectural Root Cause | Implemented Solution |
| :--- | :--- | :--- |
| **1. Symbol Mismatch** | `"GOLD 26APR"` vs `"GOLD"` | Standardized `normalizeSymbol()` helper strips spaces, slashes, and contract expiries across Watchlist, Trades, and Portfolio. |
| **2. Inconsistent `livePrices`** | Sometimes number, sometimes object | Enforced `{ ltp, bid, ask, high, low, close }` schema strictly; primitive numbers sanitized before state update. |
| **3. Socket Overwritten by API** | Concurrent `setInterval(5000)` polling | Decommissioned REST quote polling; WebSocket made single source of truth. |
| **4. Stale Fallbacks** | `livePrices[name] \|\| item.ltp` | Replaced with real-time connection pulse indicators; eliminated frozen fallback numbers. |
| **5. Optimistic Trade Lag** | Waiting for network roundtrip | Added optimistic reducer updates reflecting trade entry/exit immediately on button click. |
| **6 & 7. Re-render Lag** | Inline callbacks invalidating memo | Added `React.memo` with custom `arePropsEqual` on ticker cards; stable callbacks. |
| **8 & 9. M2M Delay & Desync** | Heavy unmemoized state recalculations | Split market data from trade state; instant sub-100ms M2M updates on tick arrival. |

---

## 8. Complete Developer Runbook

```bash
# 1. Start Backend Engine (Port 5000)
cd sharemarket-aws-backend-master
npm i --ignore-scripts
npm run dev

# 2. Start Web Admin Portal (Port 5173)
cd Trading_Frontend-main
npm i
npm run dev

# 3. Start Responsive Webview (Port 5174)
cd Trading_Webview-main
npm i
npm run dev

# 4. Start Mobile Trader App (Expo Dev Server)
cd trading-updated-apk-main
npm i
npx expo start
```
