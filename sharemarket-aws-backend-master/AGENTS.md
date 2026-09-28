# 🤖 DEDICATED BACKEND AGENTS REGISTRY

This backend (`sharemarket-aws-backend-master`) contains two dedicated, production-grade autonomous agents designed specifically for this trading platform:

---

## 1. `test-generator` Agent
- **Directory:** [`test-generator/`](./test-generator/)
- **Agent Guide:** [`test-generator/AGENT.md`](./test-generator/AGENT.md)
- **Product Requirement Document:** [`test-generator/PRD.md`](./test-generator/PRD.md)
- **Role:** Automated Financial & Calculation QA Engineer Agent.
- **What it does:** Automatically reads trading code (`equityPnL.js`, `brokerageHelper.js`, `segmentMargin.js`, `usdPnL.js`, `WeeklySettlementService.js`), generates independent Jest test suites, executes them in memory, and produces diagnostic reports.
- **Quick Command:**
  ```powershell
  node test-generator/index.js --all
  ```

---

## 2. `instrument-sync-checker` Agent
- **Directory:** [`instrument-sync-checker/`](./instrument-sync-checker/)
- **Agent Guide:** [`instrument-sync-checker/AGENT.md`](./instrument-sync-checker/AGENT.md)
- **Product Requirement Document:** [`instrument-sync-checker/PRD.md`](./instrument-sync-checker/PRD.md)
- **Role:** Pre-Market Instrument Identity, Mapping & Drift Verification Agent.
- **What it does:** Runs before market open (08:45 AM IST) to compare 105,000+ Zerodha master contracts and Alti foreign scrips against internal database scrips (`scrip_data`), detecting lot-size mismatches, expiry errors, strike collisions, and daily contract drift in under 1.5 seconds.
- **Quick Command:**
  ```powershell
  node instrument-sync-checker/index.js --dry-run
  ```

---

## 📊 Comparison of Both Agents

| Feature / Metric | `test-generator` | `instrument-sync-checker` |
| :--- | :--- | :--- |
| **Primary Domain** | Mathematical & Business Logic QA | Instrument Metadata & Market Data Sync |
| **Target Code** | `src/utils/`, `src/services/` | `scrip_data`, `data/instruments.json`, Alti |
| **Execution Trigger**| On-demand / CLI / Pre-commit | Daily Pre-Market Cron (08:45 AM IST) / CLI |
| **Test Suite** | `tests/unit/*.test.js` | `instrument-sync-checker/tests/*.test.js` |
| **Output Location** | `test-generator/reports/*.md` | `instrument-sync-checker/reports/*.md` |
| **Database Safety** | Zero DB Access (Pure In-Memory) | Read-Only `SELECT` Queries |
| **Secrets Protection**| Redacted | Redacted |
