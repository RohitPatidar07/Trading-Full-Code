# QA AUDIT & TEST GENERATION REPORT

**Target Module:** `src/utils/usdPnL.js`  
**Domain:** `USD_INTERNATIONAL_PNL`  
**Generated Test File:** `tests/unit/usdPnL.test.js`  
**Timestamp:** `2026-09-26T07:10:52.289Z`  

---

## 1. Business Rules Discovered & Verified
- calculateUsdPnL: pnlRaw = (BUY ? exit - entry : entry - exit) * lotSize * quantity
- Direct INR Pair (USD/INR): pnlInr = pnlRaw (no double conversion), usdInrRate = 1
- Foreign Pair Profit (pnlUsd >= 0): uses liveAsk or fallbackUsdInr * 0.90
- Foreign Pair Loss (pnlUsd < 0): uses liveBid or fallbackUsdInr * 1.10
- calculateCryptoPnL / calculateForexPnL / calculateComexPnL: wrappers around calculateUsdPnL

---

## 2. Test Execution Summary

| Metric | Value |
| :--- | :--- |
| **Total Tests Generated** | 4 |
| **Passed Tests** | 4 |
| **Failed Tests** | 0 |
| **Execution Status** | ✅ PASSED |

---

## 3. Test Cases Breakdown by Category

### Function: `calculateUsdPnL()`

- **[Happy Path]** `USD_PNL_1`: [Happy Path] XAU/USD Gold Profitable BUY (uses liveAsk / 0.90 discount) → **✅ PASS**
- **[Happy Path]** `USD_PNL_2`: [Happy Path] EUR/USD Loss BUY (uses liveBid / 1.10 premium) → **✅ PASS**
- **[Financial Calculations]** `USD_PNL_3`: [Financial Calculations] Direct USD/INR currency pair has no double conversion → **✅ PASS**
- **[Boundary & Zero Cases]** `USD_PNL_4`: [Boundary & Zero Cases] Zero price difference on foreign pair → **✅ PASS**

### Function: `calculateCryptoPnL()`


### Function: `calculateForexPnL()`


### Function: `calculateComexPnL()`


---

## 4. Failure Analysis
🎉 **Zero failures detected.** All generated mathematical assertions and business rules passed cleanly.

---

## 5. Security & Isolation Verification
- **Production DB Write:** NO
- **External Broker APIs Called:** NO
- **Secrets Exposed:** NO (All tests execute locally in pure isolation)
