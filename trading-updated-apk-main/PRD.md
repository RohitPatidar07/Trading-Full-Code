I have a React Native trading app with a TradeContext that manages trades, live prices (via socket), and portfolio calculations.

Current system:

* P/L formula: P/L = (livePrice * netQty - totalCost) * multiplier
* Portfolio screen displays precomputed pnl from context
* Dashboard (watchlist) shows live prices using livePrices state
* livePrices is updated via socket + sometimes API
* Trades refresh using setInterval (5000ms)
* Aggregation is done using useMemo

Problems:

1. Delay/lag in Portfolio P/L and M2M updates
2. Inconsistent live price updates between Dashboard and Portfolio
3. Symbol mismatch issue:

   * Example: "CRUDEOIL 26APR" vs "CRUDEOIL"
   * livePrices keys don’t always match trade names
4. livePrices sometimes stores:

   * number
   * or object { ltp, bid, ask }
     → causing inconsistency
5. Dashboard uses fallback like:
   livePrices[item.name] || parseFloat(item.ltp)
   → causing stale data

I want to fully fix and optimize this system.

Please do the following:

1. Normalize all symbols across the app

   * Create a helper function to map "GOLD 26APR" → "GOLD"
   * Ensure same key is used in:

     * livePrices
     * trades
     * portfolio

2. Make livePrices structure consistent:

   * Always store as object:
     { ltp: number, bid: number, ask: number }

3. Use socket as the ONLY source of live price updates

   * Avoid overwriting with API polling

4. Remove fallback stale values like:
   livePrices[item.name] || parseFloat(item.ltp)

5. Optimize trade updates:

   * Reduce polling interval OR replace with event-based updates
   * Implement optimistic UI updates for:

     * addTrade
     * closeTrade

6. Optimize aggregation logic:

   * Ensure useMemo dependencies are correct
   * Avoid unnecessary recalculation

7. Prevent unnecessary re-renders:

   * Use React.memo where needed
   * Ensure stable props

8. Ensure Portfolio and Dashboard always show SAME live price

9. Improve real-time performance:

   * Near-instant P/L and M2M updates
   * No lag when price changes

10. Refactor code if needed and provide:

* Updated TradeContext logic
* Updated Portfolio screen usage
* Updated Dashboard/watchlist usage

Goal:
Create a smooth, real-time trading experience with accurate and instant P/L and M2M updates, no delay, and consistent live data across all screens.
