---
name: contract-lot-agent
description: Audits and verifies contract metadata (lot_size, multiplier, tick_size, exchange/segment) across instruments. Ensures the UI hides contract types if requested while strictly maintaining contract metadata in the DB and calculation layers.
---

# Contract & Lot Metadata Agent Skill

## Overview
This skill manages the mathematical metadata associated with instruments. If this metadata is flawed or hardcoded in multiple inconsistent locations, trading orders calculate incorrect quantities and distorted profit/loss numbers.

## Critical Invariants

1. **Lot Size Source of Truth**:
   - `lot_size` MUST be derived from the instrument master table (`master_instruments` or `scrip_data`).
   - Hardcoded arrays like `MCX_LOT_SIZES` in [`symbolHelper.js`](file:///d:/Trading%20Full%20Code/sharemarket-aws-backend-master/src/utils/symbolHelper.js) or [`CommodityLotService.js`](file:///d:/Trading%20Full%20Code/sharemarket-aws-backend-master/src/services/CommodityLotService.js) must only serve as documented fallback seeds for initialization, NEVER overriding current exchange contract definitions.

2. **UI Abstraction vs Calculation Preservation**:
   - Client Requirement: "Clients do not want to see 'Type' (e.g. CE/PE/FUT) in the UI."
   - **Correct Handling**: Hide the display element in the React component or CSS view (`style={{ display: 'none' }}` or omit the UI table column).
   - **Prohibited Action**: Dropping `type` or `instrument_type` from API requests, database queries, order creation, or calculations. The backend and calculation engine MUST retain full metadata.

3. **Multipliers & Currency Conversions**:
   - Commodity & FX contracts have distinct multipliers (e.g. MCX Silver vs SilverM vs Forex XAGUSD).
   - Verify that USD/INR conversion rate (`commodity_forex_crypto_lot_sizes.usdinr_value`) is applied accurately when translating foreign currency scrips to Indian Rupee ledger entries.

## Audit Workflow

### Step 1: Scan for Inconsistent Lot Sizes
Inspect database records where lot size is 0, negative, null, or inconsistent:
```sql
SELECT id, symbol, lot_size, market_type 
FROM scrip_data 
WHERE lot_size IS NULL OR lot_size <= 0;
```

### Step 2: Cross-Check Trade Entry Lot Sizes
Check existing trade history for lot size mismatches:
```sql
SELECT 
    t.id, 
    t.symbol, 
    t.qty AS trade_qty, 
    t.lot_size_at_entry, 
    s.lot_size AS master_lot_size,
    (t.qty * COALESCE(t.lot_size_at_entry, s.lot_size, 1)) AS calculated_actual_qty
FROM trades t
LEFT JOIN scrip_data s ON t.symbol = s.symbol
ORDER BY t.id DESC
LIMIT 50;
```

### Step 3: Verify Frontend Payload
Check the React order modal in [`Trading_Frontend-main`](file:///d:/Trading%20Full%20Code/Trading_Frontend-main) to confirm that:
- The order form submits `lots` and `scrip_id` / `internal_symbol`.
- The user-facing input shows lots, while calculating total underlying shares/units in the preview.
- Contract type is omitted from display where requested, without stripping it from the dispatched Redux/Axios action payload.
