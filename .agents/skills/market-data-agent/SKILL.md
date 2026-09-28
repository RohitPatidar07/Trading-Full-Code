---
name: market-data-agent
description: Analyzes and designs high-throughput market tick ingestion (Zerodha Kite & AllTick). Decouples synchronous database writes into in-memory caching and batch streams, preventing MySQL freezes and UI lockups.
---

# Market Data & Ingestion Architecture Skill

## Overview
High-frequency market data streams (hundreds or thousands of ticks per second from Zerodha Kite Connect WebSocket and AllTick WebSocket) cause severe database stalls if ticks are directly or synchronously written into MySQL tables like `scrip_ticks_history` or `scrip_data`.

This skill provides diagnostic patterns and reference architectures to eliminate MySQL write bottlenecks.

## Root Cause of the UI/Backend Hang
1. **Synchronous Write in Tick Handler**: Each incoming tick event triggers `connection.execute('UPDATE scrip_data SET ...')` or `INSERT INTO scrip_ticks_history`.
2. **Row & Table Lock Contention**: When the database is bombarded with simultaneous single-row writes, table and index locks pile up in InnoDB.
3. **Starvation of Trading Queries**: Critical trading queries (`SELECT balance FROM users`, `INSERT INTO trades`, `SELECT ... FOR UPDATE`) are queued behind high-frequency tick updates, causing the Node backend event loop or connection pool to exhaust, freezing the UI.

## Target Architecture: Decoupled Queue & In-Memory Pipeline

```
WebSocket Stream (Zerodha / AllTick)
         │
         ▼
 ┌──────────────────────────────────────────────┐
 │  Fast In-Memory Quote Cache (Map / Redis)   │  <── Low latency (0-1ms)
 │  - Latest LTP, Bid, Ask, Volume, Timestamp   │  <── Serves UI via WebSockets
 └──────────────────────┬───────────────────────┘
                        │
                        ▼
 ┌──────────────────────────────────────────────┐
 │       In-Memory Batch Buffer / Stream        │
 │  - Collects ticks over window (e.g. 1000ms)  │
 └──────────────────────┬───────────────────────┘
                        │ (Batch Flush every 1s or 500 ticks)
                        ▼
 ┌──────────────────────────────────────────────┐
 │       Background Bulk DB Writer Worker       │
 │  - Bulk INSERT INTO scrip_ticks_history      │
 │  - Bulk ON DUPLICATE KEY UPDATE scrip_data   │
 └──────────────────────────────────────────────┘
```

## Implementation Standards for Backend Services

1. **In-Memory Cache First**:
   - In [`allticks.service.js`](file:///d:/Trading%20Full%20Code/sharemarket-aws-backend-master/src/services/allticks.service.js) and [`MarketDataService.js`](file:///d:/Trading%20Full%20Code/sharemarket-aws-backend-master/src/services/MarketDataService.js), maintain an in-memory dictionary `this.liveQuotes = new Map()`.
   - Update in-memory quote synchronously upon WebSocket message arrival.
   - Emit live quotes directly to connected frontend clients via [`SocketManager.js`](file:///d:/Trading%20Full%20Code/sharemarket-aws-backend-master/src/websocket/SocketManager.js) WITHOUT querying MySQL.

2. **Batch Queue Writer**:
   ```javascript
   class TickBatchQueue {
       constructor(flushIntervalMs = 1000, batchLimit = 500) {
           this.queue = [];
           this.flushIntervalMs = flushIntervalMs;
           this.batchLimit = batchLimit;
           this.isFlushing = false;
           this.timer = setInterval(() => this.flush(), this.flushIntervalMs);
       }

       push(tick) {
           this.queue.push(tick);
           if (this.queue.length >= this.batchLimit) {
               this.flush();
           }
       }

       async flush() {
           if (this.isFlushing || this.queue.length === 0) return;
           this.isFlushing = true;
           const batch = this.queue.splice(0, this.batchLimit);
           try {
               // Perform bulk insert using bulk syntax: INSERT INTO scrip_ticks_history (...) VALUES ?
               await db.query(
                   'INSERT INTO scrip_ticks_history (scrip_id, ltp, bid, ask, high, low, exchange_time, system_time) VALUES ?',
                   [batch.map(t => [t.scrip_id, t.ltp, t.bid, t.ask, t.high, t.low, t.exchange_time, new Date()])]
               );
           } catch (err) {
               console.error('[TickBatchQueue] Error flushing batch:', err.message);
           } finally {
               this.isFlushing = false;
           }
       }
   }
   ```

3. **Separate Storage Tiers**:
   - Tier 1: **Live LTP / Depth**: RAM / In-Memory (0ms delay).
   - Tier 2: **1-Minute OHLC Candles**: Aggregated asynchronously.
   - Tier 3: **Tick History Archive**: Partitioned table or S3 export with automated pruning of records older than 7 days.
