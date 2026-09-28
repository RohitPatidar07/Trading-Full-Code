# ⚖️ MaintenX OS – Complete Client Requirement & System Gap Audit
**Document Version:** 2.0 (Exhaustive Architectural Gap Analysis)  
**Reference Requirement File:** [`trading-updated-apk-main/PRD.md`](file:///d:/Trading%20Full%20Code/trading-updated-apk-main/PRD.md)  
**System Scopes Analyzed:** Mobile React Native App, Web Admin Portal, Core Node.js OMS Backend  

---

## 1. Deep Analysis of PRD Mobile Requirements (Items 1 to 10)

The mobile application's Product Requirement Document ([`PRD.md`](file:///d:/Trading%20Full%20Code/trading-updated-apk-main/PRD.md)) defines 10 mission-critical functional mandates. Below is the line-by-line audit of current codebase conformance versus target behavior.

---

### PRD Item 1: Universal Symbol Normalization
- **Requirement:** Standardize all symbol representations across the app so that variations such as `"GOLD 26APR"`, `"MCX:GOLD26APRFUT"`, and `"GOLD"` resolve to a single canonical hash key across `livePrices`, `trades`, and `portfolio`.
- **Current State:**
  - In [`TradeContext.js`](file:///d:/Trading%20Full%20Code/trading-updated-apk-main/src/context/TradeContext.js#L98-L115), a `normalizeSymbol` helper exists:
    ```javascript
    export const normalizeSymbol = (symbol) => {
        if (!symbol) return '';
        const tradingSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
        if (tradingSymbol.startsWith('NIFTY 50')) return 'NIFTY 50';
        if (tradingSymbol.startsWith('BANK NIFTY')) return 'BANK NIFTY';
        return tradingSymbol
            .replace(/[\s\/\_\-]+/g, '')
            .replace(/FUT$/i, '')
            .toUpperCase();
    };
    ```
- **The Gap:**
  - While `normalizeSymbol` exists in `TradeContext.js`, screen components like `PortfolioScreen.js` and `DashboardScreen.js` frequently bypass it, indexing directly via `item.name` or `item.symbol` (`livePrices[trade.symbol]`).
  - When backend emits ticks keyed by `MCX:GOLD26MAYFUT`, `PortfolioScreen.js` searches for `GOLD` or `GOLD 26MAY`, failing the lookup and causing price display to freeze at `0.00` or entry price.
- **Code Remediation:**
  Extract `normalizeSymbol` into a standalone utility [`src/utils/symbolNormalizer.js`](file:///d:/Trading%20Full%20Code/trading-updated-apk-main/src/utils/) and enforce its usage in every price lookup hook:
  ```javascript
  // Standardized hook:
  export const useNormalizedPrice = (symbol) => {
      const { livePrices } = useTrades();
      const key = normalizeSymbol(symbol);
      return livePrices[key] || { ltp: 0, bid: 0, ask: 0 };
  };
  ```

---

### PRD Item 2: Consistent `livePrices` Structure
- **Requirement:** Ensure `livePrices` always stores objects formatted strictly as `{ ltp: number, bid: number, ask: number, high: number, low: number, close: number }`. Never store a raw scalar number.
- **Current State:**
  - In `TradeContext.js` lines 188–205:
    ```javascript
    if (typeof data === 'object') {
        newLtp = data.ltp || data.price || 0;
        newBid = data.bid || ...;
    } else {
        newLtp = data; // Assigns raw scalar number!
        newBid = data;
    }
    ```
- **The Gap:**
  - When a third-party feed or fallback sends a bare numeric quote (e.g. `72540.00`), `livePrices[symbol]` becomes a primitive `number` instead of an object.
  - Subsequent screen code attempting to access `livePrices[symbol].bid` or `livePrices[symbol].ask` crashes with:
    `TypeError: Cannot read property 'bid' of undefined` or `NaN`.
- **Code Remediation:**
  Enforce strict schema normalization before updating context state:
  ```javascript
  const sanitizedQuote = {
      ltp: typeof data === 'object' ? Number(data.ltp || data.price || 0) : Number(data || 0),
      bid: typeof data === 'object' ? Number(data.bid || data.ltp || 0) : Number(data || 0),
      ask: typeof data === 'object' ? Number(data.ask || data.ltp || 0) : Number(data || 0),
      high: typeof data === 'object' ? Number(data.high || 0) : 0,
      low: typeof data === 'object' ? Number(data.low || 0) : 0,
      close: typeof data === 'object' ? Number(data.close || 0) : 0
  };
  updatedPrices[normKey] = sanitizedQuote;
  ```

---

### PRD Item 3: WebSocket as ONLY Source of Truth
- **Requirement:** Eliminate concurrent REST polling intervals (`setInterval(5000)`) that overwrite fresh WebSocket quotes with delayed database values.
- **Current State:**
  - `TradeContext.js` maintains an active Socket.io subscription, but also has a background timer that fetches quotes via HTTP GET every 5,000ms.
- **The Gap:**
  - High-frequency socket ticks update the UI at $t = 0\text{ ms}$.
  - At $t = 2,500\text{ ms}$, the slower HTTP response arrives with quote data from $t = -500\text{ ms}$, overwriting the fresh socket quote with a stale price.
  - Causes the visual tick rate to "jump backwards" or flicker constantly.
- **Code Remediation:**
  Decommission HTTP polling for market rates completely. Use HTTP only for initial account bootstrap (`trades` list and `balance`); all live price mutations must flow through `SocketManager.js`.

---

### PRD Item 4: Remove Stale Fallback Values
- **Requirement:** Remove fallbacks like `livePrices[item.name] || parseFloat(item.ltp)` in watchlist and portfolio components.
- **Current State:**
  - In [`DashboardScreen.js`](file:///d:/Trading%20Full%20Code/trading-updated-apk-main/src/screens/tabs/DashboardScreen.js), cards fall back to static database-seeded prices if the socket quote is loading.
- **The Gap:**
  - The trader assumes the static price is the active market price, placing orders at rates that differ significantly from exchange prices.
- **Code Remediation:**
  Display explicit loading or connection status indicators rather than stale numeric values.

---

### PRD Item 5: Optimistic Trade Updates
- **Requirement:** Instantaneous UI feedback when clicking Buy, Sell, or Close Trade without waiting for network roundtrip.
- **Current State:**
  - UI displays an activity spinner and blocks interaction until `api.placeTrade()` completes.
- **Code Remediation:**
  Implement optimistic reducer update in `TradeContext.js`:
  ```javascript
  const placeTradeOptimistic = async (orderParams) => {
      const tempId = `temp_${Date.now()}`;
      const optimisticTrade = { ...orderParams, id: tempId, status: 'OPEN', isPending: true };
      
      // Update UI immediately (0ms latency)
      setTrades(prev => [optimisticTrade, ...prev]);

      try {
          const serverResponse = await api.placeTrade(orderParams);
          // Replace temp trade with verified server record
          setTrades(prev => prev.map(t => t.id === tempId ? serverResponse.trade : t));
      } catch (err) {
          // Rollback on failure and alert user
          setTrades(prev => prev.filter(t => t.id !== tempId));
          Alert.alert('Order Failed', err.message);
      }
  };
  ```

---

### PRD Item 6 & 7: Re-render Elimination & Memoization
- **Requirement:** Apply `React.memo` and stable callbacks to avoid full list re-renders on ticker changes.
- **Current State:**
  - Watchlist flat lists pass inline anonymous functions (`onPress={() => handlePress(item)}`), invalidating memoization on every tick.
- **Code Remediation:**
  Wrap ticker cards in `React.memo` with custom comparison:
  ```javascript
  const TickerCard = React.memo(({ item, price, onSelect }) => {
      return (
          <TouchableOpacity onPress={() => onSelect(item.symbol)}>
              <Text>{item.name}</Text>
              <Text>{price.ltp.toFixed(2)}</Text>
          </TouchableOpacity>
      );
  }, (prev, next) => {
      return prev.price.ltp === next.price.ltp && prev.price.change === next.price.change;
  });
  ```

---

### PRD Item 8 & 9: Real-Time Performance & Screen Synchronization
- **Requirement:** Ensure Dashboard and Portfolio always display identical LTP and sub-100ms P&L updates.
- **Remediation Strategy:**
  - Achieved automatically by centralizing all price lookups through the normalized socket state.

---

## 2. Web Admin Portal Architectural Gaps

| Area | Observed Gap | Impact | Required Fix |
| :--- | :--- | :--- | :--- |
| **Live M2M Virtualization** | Full DOM table rendered for 100+ clients without row virtualization. | Browser UI freezes when 20+ ticks/sec arrive. | Wrap table body in `react-window` `FixedSizeList`. |
| **Client Duplication** | `CopyTradingClientForm.jsx` misses newly added `user_segments` columns (`exposure_multiplier`, `margin_type`). | Cloned clients inherit wrong leverage. | Synchronize all SQL segment columns in copy controller. |
| **Audit Log Search** | No full-text search on `action_ledger.description`. | Admins cannot filter dispute logs by trade ID. | Add SQL `LIKE` query support on `description`. |

---

## 3. Backend Architectural Gaps

| Module | Observed Gap | Impact | Required Fix |
| :--- | :--- | :--- | :--- |
| **Root AI Endpoints** | `/ai-parse`, `/execute-command` lack authentication middleware. | Critical vulnerability: unauthorized order execution. | Add `authenticateToken` in `server.js`. |
| **RMS Concurrency** | Synchronous iteration over all traders every 10s. | Event loop blocks; WebSocket ticks stall. | Batch trader checks into asynchronous chunks. |
| **Financial Ledger** | Some balance mutations occur without `START TRANSACTION`. | Race condition risk during concurrent operations. | Wrap all balance/ledger logic in atomic transactions. |
