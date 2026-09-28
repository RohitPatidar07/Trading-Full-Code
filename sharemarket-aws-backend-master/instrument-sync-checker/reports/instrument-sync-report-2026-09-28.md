# PRE-MARKET INSTRUMENT SYNCHRONIZATION REPORT

**Run ID:** `SYNC_2026-09-28T09-05-48-240Z_2b3d8f`  
**Run Date:** `2026-09-28`  
**Execution Time:** `2026-09-28T09:05:48.240Z`  
**Duration:** `3ms`  
**Status:** **`MISMATCHES_FOUND`**  
**Execution Mode:** `DRY-RUN (Safe Validation)`  

---

## 1. Executive Summary

| Category | Count | Status |
| :--- | :--- | :--- |
| **Total Internal Scrips** | 1 | Registered Tradable Instruments |
| **Total Zerodha Master Instruments** | 1 | Indian Market Master Feed |
| **Total Alti Foreign Scrips** | 0 | Foreign Commodity/Forex Feed |
| **Exact Canonical Matches** | 1 | Verified 100% Identity |
| **Normalized Matches** | 0 | Verified with Symbol Normalization |
| **Missing in Zerodha** | 0 | Internal Scrips Unmatched in Zerodha |
| **Missing in Alti** | 0 | Internal Scrips Unmatched in Alti |

### Issue Severity Breakdown
- 🚨 **CRITICAL ISSUES:** `1` (Wrong Lot Size, Strike, Expiry, or Feed Collision)
- ⚠️ **HIGH ISSUES:** `0` (Exchange/Segment Mismatch or Missing Tradable Scrip)
- ℹ️ **MEDIUM ISSUES:** `0` (Tick size or Non-critical variance)
- 📝 **LOW / INFO:** `0` (New daily contract rolls or token variations)

---

## 2. Detailed Metadata Discrepancies

| Severity | Type | Symbol | Source | Internal (Expected) | External (Actual) | Impact |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CRITICAL** | `LOT_SIZE_MISMATCH` | **SILVER** | ZERODHA | 30 | 5 | Lot size discrepancy alters physical contract unit sizing and multiplied financial P&L. |

---

## 3. Daily Drift Detection (Against Yesterday Snapshot)

- **New Contracts Discovered:** `1`
- **Delisted / Expired Contracts:** `1`
- **Suspicious Lot Size / Attribute Drifts:** `0`

---

## 4. Security & Isolation Controls
- **Production Instrument DB Writes:** NO (Read-only verification)
- **Live Trading APIs Called:** NO (Zero orders placed)
- **Credentials Exposed:** NO (Secrets strictly redacted)
