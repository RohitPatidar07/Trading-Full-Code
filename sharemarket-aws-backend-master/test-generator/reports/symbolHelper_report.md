# QA AUDIT & TEST GENERATION REPORT

**Target Module:** `src/utils/symbolHelper.js`  
**Domain:** `SYMBOL_AND_SEGMENT_PARSING`  
**Generated Test File:** `tests/unit/symbolHelper.test.js`  
**Timestamp:** `2026-09-26T07:10:58.106Z`  

---

## 1. Business Rules Discovered & Verified
- parseOptionSymbol: Extracts root, strike, optionType (CE/PE), and expiry date
- isOptionsSymbol: Requires a digit preceding CE/PE suffix to prevent false positives like RELIANCE
- isSameInstrument: Matches normalized symbols across prefixes, suffixes, and base scrips
- getMcxBaseScrip: Matches longest prefix from master MCX list

---

## 2. Test Execution Summary

| Metric | Value |
| :--- | :--- |
| **Total Tests Generated** | 9 |
| **Passed Tests** | 3 |
| **Failed Tests** | 6 |
| **Execution Status** | ❌ FAILED |

---

## 3. Test Cases Breakdown by Category

### Function: `parseOptionSymbol()`

- **[Happy Path]** `OPT_SYM_1`: [Happy Path] Standard monthly NIFTY CE option → **❌ FAIL**
- **[Happy Path]** `OPT_SYM_2`: [Happy Path] Standard BANKNIFTY PE option → **❌ FAIL**
- **[Boundary & Zero Cases]** `OPT_SYM_3`: [Boundary & Zero Cases] Non-option symbol returns null → **✅ PASS**

### Function: `isSameInstrument()`

- **[Happy Path]** `SAME_INST_1`: [Happy Path] Exact match with prefix difference → **✅ PASS**
- **[Happy Path]** `SAME_INST_2`: [Happy Path] Futures base scrip match → **✅ PASS**
- **[Happy Path]** `SAME_INST_3`: [Happy Path] Different strikes are NOT the same instrument → **❌ FAIL**

### Function: `getMcxBaseScrip()`


### Function: `isOptionsSymbol()`

- **[Happy Path]** `IS_OPT_1`: [Happy Path] True option symbol ending in digit + CE → **❌ FAIL**
- **[Regression & Known Risk Areas]** `IS_OPT_2`: [Regression & Known Risk Areas] Plain stock ending in CE/PE characters (RELIANCE) is NOT an option → **❌ FAIL**
- **[Regression & Known Risk Areas]** `IS_OPT_3`: [Regression & Known Risk Areas] Plain stock FINANCE is NOT an option → **❌ FAIL**

---

## 4. Failure Analysis & Diagnostics

### ⚠️ Issue in: `OPT_SYM_1: [Happy Path] Standard monthly NIFTY CE option`
- **Classification:** `FINANCIAL_CALCULATION_DISCREPANCY`
- **Details:**
```
Error: expect(received).toEqual(expected) // deep equality

Expected: "24000"
Received: "0"
    at Object.toEqual (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\tests\unit\symbolHelper.test.js:18:35)
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

### ⚠️ Issue in: `OPT_SYM_2: [Happy Path] Standard BANKNIFTY PE option`
- **Classification:** `FINANCIAL_CALCULATION_DISCREPANCY`
- **Details:**
```
Error: expect(received).toEqual(expected) // deep equality

Expected: "52000"
Received: "0"
    at Object.toEqual (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\tests\unit\symbolHelper.test.js:28:35)
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

### ⚠️ Issue in: `SAME_INST_3: [Happy Path] Different strikes are NOT the same instrument`
- **Classification:** `FINANCIAL_CALCULATION_DISCREPANCY`
- **Details:**
```
Error: expect(received).toEqual(expected) // deep equality

Expected: false
Received: true
    at Object.toEqual (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\tests\unit\symbolHelper.test.js:70:28)
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

### ⚠️ Issue in: `IS_OPT_1: [Happy Path] True option symbol ending in digit + CE`
- **Classification:** `INTERFACE_MISMATCH`
- **Details:**
```
TypeError: func is not a function
    at Object.func (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\tests\unit\symbolHelper.test.js:82:68)
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
- **Classification:** `INTERFACE_MISMATCH`
- **Details:**
```
TypeError: func is not a function
    at Object.func (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\tests\unit\symbolHelper.test.js:89:68)
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
- **Classification:** `INTERFACE_MISMATCH`
- **Details:**
```
TypeError: func is not a function
    at Object.func (D:\kiaan\Trading-Full-Code\sharemarket-aws-backend-master\tests\unit\symbolHelper.test.js:96:68)
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
