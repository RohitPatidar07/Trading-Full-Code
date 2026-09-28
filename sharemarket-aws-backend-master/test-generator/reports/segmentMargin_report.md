# QA AUDIT & TEST GENERATION REPORT

**Target Module:** `src/utils/segmentMargin.js`  
**Domain:** `MARGIN_CALCULATIONS`  
**Generated Test File:** `tests/unit/segmentMargin.test.js`  
**Timestamp:** `2026-09-26T07:10:56.210Z`  

---

## 1. Business Rules Discovered & Verified
- calculateSegmentMargin: TradeType = isHolding ? HOLDING : INTRADAY
- PER_TURNOVER_BASIS: requiredMargin = turnover / exposureDivisor
- PER_LOT_BASIS: requiredMargin = lotCount * lotMargins[symbol][tradeType]
- PER_LOT_BASIS Fallback: turnover / exposureDivisor if lot margin not defined
- Auto-detects segment from symbol prefixes (MCX:, FOREX:, CRYPTO:, COMEX:) and CE/PE options

---

## 2. Test Execution Summary

| Metric | Value |
| :--- | :--- |
| **Total Tests Generated** | 7 |
| **Passed Tests** | 4 |
| **Failed Tests** | 3 |
| **Execution Status** | ❌ FAILED |

---

## 3. Test Cases Breakdown by Category

### Function: `calculateSegmentMargin()`

- **[Happy Path]** `MARGIN_1`: [Happy Path] Equity Intraday Margin (Turnover / 500x) → **✅ PASS**
- **[Happy Path]** `MARGIN_2`: [Happy Path] Equity Holding Margin (Turnover / 100x) → **✅ PASS**
- **[Financial Calculations]** `MARGIN_3`: [Financial Calculations] MCX Per Lot Basis Margin Lookup → **❌ FAIL**
- **[Boundary & Zero Cases]** `MARGIN_4`: [Boundary & Zero Cases] Zero quantity returns 0 margin → **✅ PASS**

### Function: `isMcxSymbol()`


### Function: `isOptionsSymbol()`

- **[Happy Path]** `IS_OPT_1`: [Happy Path] True option symbol ending in digit + CE → **✅ PASS**
- **[Regression & Known Risk Areas]** `IS_OPT_2`: [Regression & Known Risk Areas] Plain stock ending in CE/PE characters (RELIANCE) is NOT an option → **❌ FAIL**
- **[Regression & Known Risk Areas]** `IS_OPT_3`: [Regression & Known Risk Areas] Plain stock FINANCE is NOT an option → **❌ FAIL**

### Function: `getMcxBaseScrip()`


---

## 4. Failure Analysis & Diagnostics

### ⚠️ Issue in: `MARGIN_3: [Financial Calculations] MCX Per Lot Basis Margin Lookup`
- **Classification:** `FINANCIAL_CALCULATION_DISCREPANCY`
- **Details:**
```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 60000
Received: 30000

Expected precision:    2
Expected difference: < 0.005
Received difference:   30000
    at Object.toBeCloseTo (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\tests\unit\segmentMargin.test.js:67:28)
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

### ⚠️ Issue in: `IS_OPT_2: [Regression & Known Risk Areas] Plain stock ending in CE/PE characters (RELIANCE) is NOT an option`
- **Classification:** `FINANCIAL_CALCULATION_DISCREPANCY`
- **Details:**
```
Error: expect(received).toEqual(expected) // deep equality

Expected: false
Received: true
    at Object.toEqual (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\tests\unit\segmentMargin.test.js:99:28)
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

### ⚠️ Issue in: `IS_OPT_3: [Regression & Known Risk Areas] Plain stock FINANCE is NOT an option`
- **Classification:** `FINANCIAL_CALCULATION_DISCREPANCY`
- **Details:**
```
Error: expect(received).toEqual(expected) // deep equality

Expected: false
Received: true
    at Object.toEqual (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\tests\unit\segmentMargin.test.js:106:28)
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
