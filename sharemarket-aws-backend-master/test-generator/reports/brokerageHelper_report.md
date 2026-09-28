# QA AUDIT & TEST GENERATION REPORT

**Target Module:** `src/utils/brokerageHelper.js`  
**Domain:** `BROKERAGE_CALCULATIONS`  
**Generated Test File:** `tests/unit/brokerageHelper.test.js`  
**Timestamp:** `2026-09-26T07:10:54.267Z`  

---

## 1. Business Rules Discovered & Verified
- calcBrokerageFromRate: PER_LOT / PER_UNIT = baseLotsCount * rate
- calcBrokerageFromRate: PER_CRORE = (TurnoverInr / 10,000,000) * rate
- calcBrokerageFromRate: Turnover = (entryPrice + exitPrice) * totalSharesOrUnits
- calcBrokerageFromRate: Foreign segment turnover converted via usdInrRate
- calculateTradeBrokerage: Priority 1: Scrip-specific rate from clientConfig (brokerMcxBrokerage / brokerEquityBrokerage)
- calculateTradeBrokerage: Priority 2: user_segments table row (Equity is forced to PER_CRORE)
- calculateTradeBrokerage: Priority 3: clientConfig defaults (Options index ₹20/lot, Equity ₹800/Cr turnover, MCX config)

---

## 2. Test Execution Summary

| Metric | Value |
| :--- | :--- |
| **Total Tests Generated** | 9 |
| **Passed Tests** | 8 |
| **Failed Tests** | 1 |
| **Execution Status** | ❌ FAILED |

---

## 3. Test Cases Breakdown by Category

### Function: `calcBrokerageFromRate()`

- **[Happy Path]** `BRK_1`: [Happy Path] PER_LOT Brokerage for 5 lots at 20/lot → **✅ PASS**
- **[Happy Path]** `BRK_2`: [Happy Path] PER_CRORE Turnover Brokerage on Indian Equity (1 Crore turnover at 800/Cr) → **✅ PASS**
- **[Financial Calculations]** `BRK_3`: [Financial Calculations] PER_LOT with isUnitMode calculates proportional fraction → **✅ PASS**
- **[Boundary & Zero Cases]** `BRK_4`: [Boundary & Zero Cases] Zero rate or zero quantity returns 0 → **✅ PASS**
- **[Precision & Decimals]** `BRK_5`: [Precision & Decimals] Fractional turnover brokerage → **✅ PASS**

### Function: `calculateTradeBrokerage()`

- **[Happy Path]** `TRD_BRK_1`: [Happy Path] Option index default rate of 20/lot → **✅ PASS**
- **[Happy Path]** `TRD_BRK_2`: [Happy Path] Equity default turnover rate (₹800/Cr) → **❌ FAIL**
- **[Financial Calculations]** `TRD_BRK_3`: [Financial Calculations] Priority 1: Scrip-specific rate override in clientConfig for MCX → **✅ PASS**
- **[Financial Calculations]** `TRD_BRK_4`: [Financial Calculations] Priority 2: user_segments table row override → **✅ PASS**

### Function: `cleanSymbolName()`


---

## 4. Failure Analysis & Diagnostics

### ⚠️ Issue in: `TRD_BRK_2: [Happy Path] Equity default turnover rate (₹800/Cr)`
- **Classification:** `FINANCIAL_CALCULATION_DISCREPANCY`
- **Details:**
```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 32
Received: 0

Expected precision:    2
Expected difference: < 0.005
Received difference:   32
    at Object.toBeCloseTo (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\tests\unit\brokerageHelper.test.js:107:28)
    at Promise.finally.completed (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-circus\build\jestAdapterInit.js:1834:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-circus\build\jestAdapterInit.js:1774:10)
    at _callCircusTest (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-circus\build\jestAdapterInit.js:1167:40)
    at _runTestInContext (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-circus\build\jestAdapterInit.js:1103:3)
    at runTestWithContext (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-circus\build\jestAdapterInit.js:996:5)
    at _runTestsForDescribeBlockOnce (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-circus\build\jestAdapterInit.js:1008:11)
    at _runTestsForDescribeBlock (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-circus\build\jestAdapterInit.js:824:5)
    at _runTestsForDescribeBlockOnce (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-circus\build\jestAdapterInit.js:1003:11)
    at _runTestsForDescribeBlock (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-circus\build\jestAdapterInit.js:824:5)
    at _runTestsForDescribeBlockOnce (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-circus\build\jestAdapterInit.js:1003:11)
    at _runTestsForDescribeBlock (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-circus\build\jestAdapterInit.js:824:5)
    at run (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-circus\build\jestAdapterInit.js:789:3)
    at runAndTransformResultsToJestFormat (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-circus\build\jestAdapterInit.js:2300:21)
    at jestAdapter (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-circus\build\runner.js:111:19)
    at runTestInternal (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-runner\build\index.js:247:16)
    at runTest (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\node_modules\jest-runner\build\index.js:315:7)
```
- **Recommendation:** Verify business calculation formula against domain requirements


---

## 5. Security & Isolation Verification
- **Production DB Write:** NO
- **External Broker APIs Called:** NO
- **Secrets Exposed:** NO (All tests execute locally in pure isolation)
