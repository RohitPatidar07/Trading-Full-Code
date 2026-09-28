# Database Migration & Performance Guard

High-frequency tick volume and multi-client order execution generate intense concurrent load on MySQL. Every database migration and query must be strictly vetted against table locking and resource exhaustion.

## 1. Hot Tables Protection
The following tables are hot execution paths and MUST NEVER be subjected to blocking operations:
- `trades` (Live position updates, order placement, stop-loss trigger)
- `ledger` (Financial double-entry ledger)
- `scrip_ticks_history` (High-frequency market tick storage)
- `scrip_data` (Live instrument market cache)

## 2. Prohibited Migration Patterns
Any PR or database script containing the following MUST BE REJECTED or REVISED:
1. `ALTER TABLE` on hot tables without evaluating lock implications or without `ALGORITHM=INPLACE, LOCK=NONE` where supported.
2. `TRUNCATE TABLE` or `DELETE FROM scrip_data` during live trading hours (drops all lot size metadata mid-session).
3. Adding columns without default values or nullable definitions on tables exceeding 100k rows.
4. Unindexed foreign keys or joins (e.g. searching `trades` without index on `user_id`, `status`, `symbol`, or `created_at`).
5. Running bulk backfills inside long-running open transactions that hold row/table locks.

## 3. High-Frequency Market Tick Write Rules
- Direct single-row `INSERT INTO scrip_ticks_history` inside WebSocket event handlers is STRICTLY PROHIBITED.
- Incoming ticks MUST be batched in memory (e.g. 500ms - 1000ms flush intervals or 500-tick batch arrays) before bulk inserting.
- High-frequency live quotes (LTP, Best Bid, Best Ask) must be served from an in-memory/Redis cache, NOT queried from disk MySQL on every user render.
- Keep tick history retention policy capped (e.g. prune ticks older than 7 days using partitioned tables or cron cleanup).
