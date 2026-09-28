# Trading Invariants & Mathematical Precision Rules

When modifying or reviewing any code touching orders, trades, lot sizing, margins, or P&L in this repository, you MUST strictly enforce the following rules:

## 1. Instrument Resolution Rules
- NEVER match an instrument by raw ticker name string alone (e.g. `symbol = 'GOLD'`).
- Always resolve instruments using canonical attributes:
  - `exchange` (`MCX`, `NSE`, `NFO`, `FOREX`, `CRYPTO`, etc.)
  - `segment` (`EQUITY`, `COMMODITY`, `FUTURES`, `OPTIONS`, `CURRENCY`)
  - `expiry_date` (ISO date `YYYY-MM-DD` or `NULL` for cash equities)
  - `strike_price` (Numeric or `0.00` for futures/cash)
  - `option_type` (`CE`, `PE`, or `XX` for non-options)
- If provider tokens differ between Zerodha and AllTick (e.g. `XAU/USD` vs `GOLD` vs `XAUUSD`), lookup must occur via the `provider_instrument_mappings` table, NEVER inline ad-hoc regex without mapping table fallbacks.

## 2. Quantity & Lot Size Invariants
- The formula $\text{Quantity} = \text{Lots} \times \text{Lot Size}$ is mandatory unless the user account has `trade_equity_units = 1` explicitly enabled for the Equity segment.
- Lot sizes MUST be loaded from the master instrument metadata record.
- NEVER hardcode lot sizes in business logic files. Use a single source of truth (`MasterInstrumentService` / `master_instruments`).
- When orders are placed, the resolved `lot_size` at entry time MUST be persisted in the trade row (e.g. `trades.lot_size_at_entry`) to prevent historical P&L corruption if contract lot sizes change in future contracts.

## 3. Financial Calculations & Monetary Precision
- Floating point inaccuracies: Avoid cumulative math like `0.1 * qty` without decimal rounding.
- Rounding: Keep calculations in full 4-decimal precision internally (`DECIMAL(18,4)`), and round to 2 decimal places strictly at the presentation / statement boundary (`round(val, 2)` or `toPrecision`).
- Realized P&L Calculation:
  - Long: $(\text{Exit Price} - \text{Entry Price}) \times \text{Actual Quantity} \times \text{Multiplier}$
  - Short: $(\text{Entry Price} - \text{Exit Price}) \times \text{Actual Quantity} \times \text{Multiplier}$
- MTM (Unrealized) P&L Calculation:
  - Long: $(\text{Current LTP} - \text{Entry Price}) \times \text{Actual Quantity} \times \text{Multiplier}$
  - Short: $(\text{Entry Price} - \text{Current LTP}) \times \text{Actual Quantity} \times \text{Multiplier}$
- Net P&L: Deduct total brokerage and statutory charges (STT, exchange fees, SEBI charges, GST) before crediting to ledger.

## 4. UI vs Database Separation
- If a client requests that the UI should not display "Contract Type" or "Expiry", hide it using frontend CSS/rendering components.
- NEVER delete or drop `instrument_type` or metadata columns from MySQL tables, backend API payloads, or internal services.
