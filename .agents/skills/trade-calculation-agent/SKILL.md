---
name: trade-calculation-agent
description: Independently verifies Lots × Lot Size = Quantity, recomputes Gross P&L, Brokerage, STT/Taxes, and Realized/Unrealized MTM P&L for closed and open trades, isolating calculation discrepancies between order entry and ledger tables.
---

# Trade Calculation Agent Skill

## Overview
This skill acts as an independent mathematical verifier for orders, positions, and ledger records. It references the project's official specification in [`Memory Agent/Formula.md`](file:///d:/Trading%20Full%20Code/Memory%20Agent/Formula.md) to audit calculations.

## Core Formula Reference (MaintenX / Zerodha Simulator)

### 1. Quantity Validation
$$\text{Expected Quantity} = \begin{cases} 
\text{Lots} \times \text{Lot Size} & \text{if } \text{trade\_equity\_units} = 0 \text{ or segment} \neq \text{'EQUITY'} \\
\text{Lots} & \text{if } \text{trade\_equity\_units} = 1 \text{ and segment} = \text{'EQUITY'}
\end{cases}$$

### 2. Equity & NFO (Futures & Options) P&L
- **BUY:** $(\text{Exit Price} - \text{Entry Price}) \times \text{Total Shares}$
- **SELL:** $(\text{Entry Price} - \text{Exit Price}) \times \text{Total Shares}$
*(No foreign exchange multiplier is applied).*

### 3. MCX Commodity P&L
- **BUY:** $(\text{Exit Price} - \text{Entry Price}) \times \text{Lots} \times \text{Lot Size}$
- **SELL:** $(\text{Entry Price} - \text{Exit Price}) \times \text{Lots} \times \text{Lot Size}$
*(Native INR; does not use equity units mode).*

### 4. International, Forex & Crypto P&L
- **Raw USD P&L:** $(\Delta \text{Price}) \times \text{Lot Size} \times \text{Lots}$
- **Direct INR Pairs (e.g. USDINR):** $\text{PnL (INR)} = \text{Raw PnL}$
- **Foreign Pairs (BTC, EURUSD, XAUUSD):**
  $$\text{PnL (INR)} = \text{Raw USD PnL} \times \text{Selected USD/INR Rate}$$
  - **If Profit ($\ge 0$):** Uses `liveAsk` rate or fallback: $95.10 \times 0.90 = \mathbf{85.59}$
  - **If Loss ($< 0$):** Uses `liveBid` rate or fallback: $95.10 \times 1.10 = \mathbf{104.61}$

### 5. Brokerage Computation
- **PER_LOT Mode:**
  $$\text{Brokerage} = \text{brokerage\_value} \times \text{Base Lots Count}$$
- **PER_CRORE (Turnover) Mode:**
  > [!IMPORTANT]
  > Double-Leg Turnover applies: Commission is charged on both entry and exit legs simultaneously at trade close:
  $$\text{Turnover} = (\text{Entry Price} + \text{Exit Price}) \times \text{Total Quantity} \times \text{FX Rate (83.50)}$$
  $$\text{Brokerage} = \frac{\text{Turnover}}{10,000,000} \times \text{brokerage\_rate}$$

### 6. Three Distinct FX Rates Benchmark
1. **Brokerage Default FX:** `83.50`
2. **PnL Default FX:** `95.10` (with $\pm 10\%$ bid/ask spread)
3. **Margin Default FX:** `86.68`

## Verification Workflow

When auditing any trade:
1. Load trade record (`trades.id`).
2. Verify:
   - `qty` matches expected lot conversion.
   - `lot_size_at_entry` matches master contract metadata.
   - `pnl` matches exact formula above.
   - `brokerage` matches segment setting (`PER_LOT` vs `PER_CRORE`).
   - `ledger.amount` matches $(\text{Net PnL} = \text{pnl} - \text{brokerage})$.
3. Report any discrepancy directly to the developer or QA team with file, line, and diff.
