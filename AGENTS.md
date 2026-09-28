# Antigravity Workspace Guidelines – Share Market Simulation Platform

This workspace contains the complete full-stack trading simulation platform:
- **Backend**: Node.js + Express + MySQL 8.4 RDS ([`sharemarket-aws-backend-master/`](file:///d:/Trading%20Full%20Code/sharemarket-aws-backend-master))
- **Web Admin/Client Frontend**: React.js ([`Trading_Frontend-main/`](file:///d:/Trading%20Full%20Code/Trading_Frontend-main))
- **Trading Webview & Mobile APK**: React / WebView / Native wrapper ([`Trading_Webview-main/`](file:///d:/Trading%20Full%20Code/Trading_Webview-main), [`trading-updated-apk-main/`](file:///d:/Trading%20Full%20Code/trading-updated-apk-main))
- **System Memory & Architectural Docs**: [`Memory Agent/`](file:///d:/Trading%20Full%20Code/Memory%20Agent)

---

## 🏛️ Core System Architecture & Non-Negotiable Invariants

### 1. Canonical Instrument Identity Rule (Never Match by Name Alone)
- Every tradable contract MUST resolve to an **Internal Master Instrument ID**.
- Raw symbols from data providers (**Zerodha / Kite Connect** or **AllTick**) are provider tokens and MUST NOT serve as global unique keys.
- Unique identity is strictly defined by composite tuple:
  `{ exchange, segment, symbol, expiry, strike_price, option_type }`
- Options contracts MUST always distinguish `CE` (Call) vs `PE` (Put).
- Never allow duplicate records or fuzzy string matching for distinct contract expiries or strikes.

### 2. Contract Metadata & UI Abstraction
- Every instrument record MUST store:
  - `instrument_type` (`EQ`, `FUT`, `CE`, `PE`, `COMMODITY`, `FOREX`, `CRYPTO`)
  - `lot_size` (Positive integer, e.g. 50 for NIFTY, 15 for BANKNIFTY)
  - `multiplier` (e.g. point value, USDINR conversion)
  - `tick_size` (e.g. 0.05)
  - `exchange` / `segment`
- **UI Abstraction**: If client UI specifies hiding "instrument_type", hide it in the presentation layer (CSS/component render). **NEVER remove or omit `instrument_type` from the database, calculations, or API payloads.**

### 3. Quantity & P&L Calculation Formula
All trade calculations MUST adhere strictly to:
$$\text{Actual Quantity} = \text{Lots} \times \text{Lot Size}$$
$$\text{Buy Trade Turnover} = \text{Actual Quantity} \times \text{Entry Price}$$
$$\text{Gross P\&L (BUY)} = (\text{Exit Price} - \text{Entry Price}) \times \text{Actual Quantity} \times \text{Multiplier}$$
$$\text{Gross P\&L (SELL)} = (\text{Entry Price} - \text{Exit Price}) \times \text{Actual Quantity} \times \text{Multiplier}$$
$$\text{Net P\&L} = \text{Gross P\&L} - (\text{Brokerage} + \text{STT/Exchange Charges} + \text{Taxes} + \text{Overnight Swap})$$

**Financial Precision**:
- Avoid JavaScript floating-point errors (e.g. `0.1 + 0.2 !== 0.3`).
- Round final rupee values to 2 or 4 decimal places explicitly or store amounts in integer paise / `DECIMAL(18,4)`.

### 4. High-Frequency Market Data & Database Safeguards
- **Never perform synchronous per-tick MySQL writes** on incoming WebSocket streams.
- All high-frequency tick data (AllTick / Kite Connect) must flow through:
  $$\text{WebSocket / Stream} \longrightarrow \text{In-Memory Cache (LTP/Depth)} \longrightarrow \text{Batch Queue} \longrightarrow \text{Aggregated DB}$$
- Raw 1-second ticks, 1-minute candles, and real-time LTP cache MUST be decoupled so UI and trade operations never freeze or encounter MySQL table lock waits.

---

## 🤖 Specialized Antigravity Multi-Agent Skills

This repository is equipped with dedicated Antigravity workflow skills in [`.agents/skills/`](file:///d:/Trading%20Full%20Code/.agents/skills):

| Skill Name | Location | Primary Responsibility |
| :--- | :--- | :--- |
| **`instrument-mapping-agent`** | [`.agents/skills/instrument-mapping-agent/SKILL.md`](file:///d:/Trading%20Full%20Code/.agents/skills/instrument-mapping-agent/SKILL.md) | Compares AllTick & Zerodha feeds, audits duplicates, builds master registry keyed on Internal Instrument ID. |
| **`contract-lot-agent`** | [`.agents/skills/contract-lot-agent/SKILL.md`](file:///d:/Trading%20Full%20Code/.agents/skills/contract-lot-agent/SKILL.md) | Audits and validates `lot_size`, `multiplier`, and `tick_size`. Enforces UI-hide without DB removal. |
| **`trade-calculation-agent`** | [`.agents/skills/trade-calculation-agent/SKILL.md`](file:///d:/Trading%20Full%20Code/.agents/skills/trade-calculation-agent/SKILL.md) | Independently recomputes `Lots × Lot Size = Quantity`, brokerage, turnover, and realized/unrealized MTM P&L. |
| **`market-data-agent`** | [`.agents/skills/market-data-agent/SKILL.md`](file:///d:/Trading%20Full%20Code/.agents/skills/market-data-agent/SKILL.md) | Reviews tick ingestion paths, identifies MySQL locking bottlenecks, and enforces batch/caching architecture. |
| **`order-flow-tracer`** | [`.agents/skills/order-flow-tracer/SKILL.md`](file:///d:/Trading%20Full%20Code/.agents/skills/order-flow-tracer/SKILL.md) | Traces trade execution through UI Form → Express Controller → DB Table → Broker Feed to isolate discrepancies. |
| **`root-cause-qa-agent`** | [`.agents/skills/root-cause-qa-agent/SKILL.md`](file:///d:/Trading%20Full%20Code/.agents/skills/root-cause-qa-agent/SKILL.md) | Synthesizes findings into the standard diagnosis format: Issue → Evidence → Root Cause → Fix → Regression Risk → Test Case. |

---

## 🛡️ Database Safety Protocols
1. **Production Read-Only Guard**: Database queries executed during analysis and diagnosis MUST be read-only (`SELECT`). Never execute unvetted `UPDATE`, `DELETE`, or `DROP` statements directly on live data.
2. **Schema Modifications**: Any table modification MUST be written as an idempotent SQL migration script with explicit rollback steps and zero lock penalty on hot tables (`trades`, `scrip_ticks_history`, `ledger`).
