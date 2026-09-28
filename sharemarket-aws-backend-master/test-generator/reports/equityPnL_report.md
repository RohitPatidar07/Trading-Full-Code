# QA AUDIT & TEST GENERATION REPORT

**Target Module:** `src/utils/equityPnL.js`  
**Domain:** `INDIAN_PNL`  
**Generated Test File:** `tests/unit/equityPnL.test.js`  
**Timestamp:** `2026-09-26T07:10:50.427Z`  

---

## 1. Business Rules Discovered & Verified
- calculateEquityPnL: BUY PnL = (exitPrice - entryPrice) * totalShares
- calculateEquityPnL: SELL PnL = (entryPrice - exitPrice) * totalShares
- calculateEquityPnL: totalShares resolution follows actualQty -> (qtyInput * (isUnitMode ? 1 : lotSize)) -> qty
- calculateMcxPnL: Strictly traded in Lots * LotSize
- calculateMcxPnL: totalUnits = (qtyInput != null ? qtyInput : qty) * lotSize
- calculateMcxPnL: BUY PnL = (exitPrice - entryPrice) * totalUnits
- calculateMcxPnL: SELL PnL = (entryPrice - exitPrice) * totalUnits

---

## 2. Test Execution Summary

| Metric | Value |
| :--- | :--- |
| **Total Tests Generated** | 14 |
| **Passed Tests** | 14 |
| **Failed Tests** | 0 |
| **Execution Status** | ✅ PASSED |

---

## 3. Test Cases Breakdown by Category

### Function: `calculateEquityPnL()`

- **[Happy Path]** `EQ_PNL_1`: [Happy Path] BUY trade with profit → **✅ PASS**
- **[Happy Path]** `EQ_PNL_2`: [Happy Path] BUY trade with loss → **✅ PASS**
- **[Happy Path]** `EQ_PNL_3`: [Happy Path] SELL trade with profit (price drops) → **✅ PASS**
- **[Happy Path]** `EQ_PNL_4`: [Happy Path] SELL trade with loss (price rises) → **✅ PASS**
- **[Boundary & Zero Cases]** `EQ_PNL_5`: [Boundary & Zero Cases] Zero price change produces exactly 0 PnL → **✅ PASS**
- **[Precision & Decimals]** `EQ_PNL_6`: [Precision & Decimals] Fractional prices with small tick movements → **✅ PASS**
- **[Financial Calculations]** `EQ_PNL_7`: [Financial Calculations] Lot mode conversion when actualQty is null (qtyInput * lotSize) → **✅ PASS**
- **[Financial Calculations]** `EQ_PNL_8`: [Financial Calculations] Unit mode with equityUnitsMode=1 (ignores lotSize) → **✅ PASS**
- **[Regression & Known Risk Areas]** `EQ_PNL_9`: [Regression & Known Risk Areas] Regression: actualQty takes precedence over qtyInput to prevent double multiplication → **✅ PASS**

### Function: `calculateMcxPnL()`

- **[Happy Path]** `MCX_PNL_1`: [Happy Path] MCX BUY profit with 1 lot of CRUDEOIL (lot 100) → **✅ PASS**
- **[Happy Path]** `MCX_PNL_2`: [Happy Path] MCX SELL profit with 2 lots of GOLD (lot 100) → **✅ PASS**
- **[Precision & Decimals]** `MCX_PNL_3`: [Precision & Decimals] MCX SILVER Mini decimal tick calculation (lot 5) → **✅ PASS**
- **[Boundary & Zero Cases]** `MCX_PNL_4`: [Boundary & Zero Cases] MCX Zero price difference → **✅ PASS**
- **[Financial Calculations]** `MCX_PNL_5`: [Financial Calculations] MCX with qtyInput preference over qty → **✅ PASS**

---

## 4. Failure Analysis
🎉 **Zero failures detected.** All generated mathematical assertions and business rules passed cleanly.

---

## 5. Security & Isolation Verification
- **Production DB Write:** NO
- **External Broker APIs Called:** NO
- **Secrets Exposed:** NO (All tests execute locally in pure isolation)
