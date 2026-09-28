# Code Review Checklist for Financial & Trading Code

Apply this checklist to any code change touching the order book, position management, market data, or ledger accounting.

## Checklist

### 1. Lot Size & Quantity Integrity
- [ ] Are lots converted to actual quantity using verified metadata: `actual_qty = lots * lot_size`?
- [ ] Is `lot_size` retrieved from the canonical master instrument record rather than hardcoded heuristics?
- [ ] Is `lot_size_at_entry` stored alongside the order in the database?
- [ ] Is equity unit mode checked (`trade_equity_units === 1`) before assuming lot-mode multiplication?

### 2. Money Math & Rounding
- [ ] Are floating-point calculations protected against IEEE-754 precision errors?
- [ ] Are intermediate calculations performed at high precision and rounded only at the final boundary?
- [ ] Is ledger debit/credit strictly balanced (Double entry integrity: `balance_after = balance_before ± amount`)?

### 3. Instrument Lookup & Matching
- [ ] Is lookup keyed on internal ID, exchange, and full contract parameters rather than naked ticker name strings?
- [ ] Are options strikes and option types (`CE` / `PE`) validated?
- [ ] Are provider conversions (AllTick ↔ Zerodha) handled via mapping registry tables?

### 4. Concurrency & Locking
- [ ] Are database transactions scoped as tightly as possible?
- [ ] Are row locks (e.g. `SELECT ... FOR UPDATE`) used only where strictly necessary to prevent double-spending?
- [ ] Are WebSocket event handlers non-blocking and decoupled from heavy database writes?

## Review Output Format
When conducting reviews, structure your evaluation as:
- 🔴 **Blocker**: Critical calculation flaw, potential financial loss, or table-locking risk.
- 🟡 **Warning**: Performance bottleneck, missing validation, or partial fallback logic.
- 🟢 **Suggestion**: Optimization or refactoring improvement.
