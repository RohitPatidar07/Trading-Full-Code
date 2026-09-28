---
name: order-flow-tracer
description: End-to-end tracing of a specific order or trade across the UI Form, API Controller, TradeService/Engine, MySQL Database, and Broker Data Feeds to diagnose why an order failed or produced incorrect quantities or P&L.
---

# Order Flow Tracer Skill

## Overview
When a client or administrator reports an issue with a trade (e.g. "Trade #1042 executed with 1 share instead of 1 lot" or "P&L was inverted"), use this skill to trace the lifecycle of that transaction through every layer of the platform.

## Tracing Lifecycle Steps

```
1. React Frontend UI
   └── User selects Scrip, Order Type (BUY/SELL), Quantity/Lots
   └── File: Trading_Frontend-main/src/.../TradingModal.js or TradingPanel.jsx

2. Express API Endpoint
   └── POST /api/trades/place or /api/orders
   └── File: sharemarket-aws-backend-master/src/controllers/tradeController.js

3. RMS (Risk Management) & Validation
   └── Margin validation, exposure checks, scrip ban verification
   └── Files: RMSService.js, MarginService.js

4. Execution Engine (Paper / Simulated / Live)
   └── Resolves lot_size, calculates actual_qty, executes against LTP
   └── Files: TradeService.js, PaperTradingEngine.js

5. Database Persistence
   └── INSERT INTO trades (user_id, symbol, qty, entry_price, lot_size_at_entry, ...)
   └── INSERT INTO ledger (balance mutations)

6. Position Tracking & Live MTM
   └── Real-time tick evaluation vs entry_price
   └── Files: targetSLService.js, SocketManager.js
```

## Diagnostic Checklist for Reported Trade ID

Given a target `trade_id`:

1. **Inspect Raw Database Record**:
   ```sql
   SELECT * FROM trades WHERE id = <trade_id>;
   SELECT * FROM ledger WHERE reference_id = '<trade_id>' AND reference_type = 'TRADE';
   ```
2. **Examine Contract Metadata at Execution Time**:
   - Check `symbol`, `qty`, `lot_size_at_entry`, `entry_price`.
   - Compare with `scrip_data` or `master_instruments` for that symbol:
     ```sql
     SELECT * FROM scrip_data WHERE symbol = '<symbol>';
     ```
3. **Trace Controller Handler**:
   - Check what payload was received from the client: Was `qty` sent as lots or units?
   - Did the controller convert lots to units, or did `TradeService.js` attempt a secondary multiplication?
4. **Identify First Point of Divergence**:
   - State:
     - **Stage**: (e.g., Trade Creation / Margin Deduction / Trade Exit)
     - **Expected Value**: (e.g., 50 units for 1 lot NIFTY)
     - **Actual Value**: (e.g., 1 unit recorded in `trades.qty`)
     - **Offending Code**: File name and line number
     - **Remedy**: Code fix with test case
